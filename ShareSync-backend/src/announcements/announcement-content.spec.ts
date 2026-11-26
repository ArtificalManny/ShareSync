import { BadRequestException, ConflictException } from '@nestjs/common';
import { Mongoose, Types } from 'mongoose';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementSchema } from './schemas/announcements.schema';
import { assertAnnouncementContent, hasAnnouncementBody, normalizeAnnouncementText } from './announcement-content.policy';

const projectId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const authorId = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const annId = 'cccccccccccccccccccccccc';
const poll = { question: 'Choose', options: [{ text: 'A' }, { text: 'B' }] };
const file = { fileId: 'dddddddddddddddddddddddd', fileUrl: '/uploads/example.mp4' };
const link = '/uploads/example.pdf';

function fixture(existing: any = { title: 'Old', message: '<p>Body</p>', __v: 0 }) {
  const doc = { _id: new Types.ObjectId(annId), populate: jest.fn().mockResolvedValue(undefined) };
  const query = { populate: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue(doc) };
  const model = {
    create: jest.fn().mockResolvedValue(doc),
    findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(existing) }),
    findOneAndUpdate: jest.fn().mockReturnValue(query),
  };
  const projectQuery = { select: jest.fn().mockReturnThis(), lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue({ settings: { notificationsEnabled: false } }) };
  const projectModel = { findById: jest.fn().mockReturnValue(projectQuery) };
  const service = new AnnouncementsService({} as any, model as any, projectModel as any,
    {} as any, {} as any, {} as any);
  const internals = service as any;
  internals.recordProjectActivity = jest.fn().mockResolvedValue(undefined);
  internals.normalizeAffectedEntityIds = jest.fn().mockResolvedValue([]);
  internals.normalizeFileReferences = jest.fn().mockResolvedValue([]);
  return { service, model, query, internals };
}

describe('flexible announcement content', () => {
  test.each([
    { title: 'U' }, { title: '🚀' }, { message: '<p>Uno</p>' },
    { message: '&lt;' }, { poll }, { attachments: [link] },
    { attachments: ['/uploads/video.mp4'] }, { fileReferences: [file] },
  ])('accepts meaningful content: %j', (content) => {
    expect(() => assertAnnouncementContent(content)).not.toThrow();
  });
  test.each([
    {}, { title: ' \u200b' }, { message: '<p><br>&nbsp;&#8203;</p>' },
    { message: '<!-- comment --><script>hidden</script><style>hidden</style>' },
    { message: '<span title="not content > here"></span>' },
    { message: '<p>&NegativeThinSpace;&InvisibleTimes;&Tab;&NewLine;</p>' },
    { poll: { question: 'Q', options: [{ text: 'A' }] } },
    { attachments: ['javascript:alert(1)'] }, { fileReferences: [{ fileId: 'unresolved' }] },
  ])('rejects empty or invalid content: %j', (content) => {
    expect(() => assertAnnouncementContent(content)).toThrow(BadRequestException);
  });
  it('preserves actual text and formatted content', () => {
    expect(normalizeAnnouncementText('  U  ', 'title')).toBe('U');
    expect(normalizeAnnouncementText('<p><strong>Hi</strong></p>', 'message')).toBe('<p><strong>Hi</strong></p>');
    expect(normalizeAnnouncementText('<p>&nbsp;<br></p>', 'message')).toBe('');
    expect(hasAnnouncementBody('2 < 3')).toBe(true);
    expect(() => normalizeAnnouncementText(42, 'title')).toThrow(BadRequestException);
  });
  it('permits optional strings at the schema boundary without weakening identity fields', () => {
    const m = new Mongoose();
    const Model = m.model('FlexibleAnnouncementR1', AnnouncementSchema);
    const emptyText = new Model({ projectId, authorId, attachments: [link] });
    expect(emptyText.title).toBe('');
    expect(emptyText.message).toBe('');
    expect(emptyText.validateSync()).toBeUndefined();
    expect(new Model({ title: 'x' }).validateSync()?.errors).toHaveProperty('projectId');
  });
  test.each([
    { title: 'U' }, { message: '<p>Body</p>' }, { poll }, { attachments: [link] },
  ])('creates with one content type: %j', async (input) => {
    const f = fixture();
    await f.service.create({ projectId, authorId, ...input });
    expect(f.model.create).toHaveBeenCalledWith(expect.objectContaining({
      title: input.title ?? '', message: input.message ?? '',
    }));
  });
  it('creates with a validated project file only', async () => {
    const f = fixture();
    f.internals.normalizeFileReferences.mockResolvedValue([file]);
    await f.service.create({ projectId, authorId, fileReferences: [file.fileId] });
    expect(f.model.create).toHaveBeenCalledWith(expect.objectContaining({ fileReferences: [file] }));
    expect(f.internals.normalizeFileReferences).toHaveBeenCalledWith(projectId, authorId, [file.fileId]);
  });
  it('does not save a completely empty create', async () => {
    const f = fixture();
    await expect(f.service.create({ projectId, authorId, message: '<p>&nbsp;</p>', pinned: true })).rejects.toBeInstanceOf(BadRequestException);
    expect(f.model.create).not.toHaveBeenCalled();
  });
  it('does not silently publish an incomplete poll even with a headline', async () => {
    const f = fixture();
    await expect(f.service.create({ projectId, authorId, title: 'U', poll: { question: 'Q', options: ['A'] } })).rejects.toBeInstanceOf(BadRequestException);
    expect(f.model.create).not.toHaveBeenCalled();
  });
  it('keeps attachment authorization and validation in force', async () => {
    const f = fixture();
    await expect(f.service.create({ projectId, authorId, attachments: ['javascript:bad'] })).rejects.toBeInstanceOf(BadRequestException);
    f.internals.normalizeFileReferences.mockRejectedValue(new BadRequestException('No file access'));
    await expect(f.service.create({ projectId, authorId, fileReferences: [file.fileId] })).rejects.toThrow('No file access');
    expect(f.model.create).not.toHaveBeenCalled();
  });
  it('clears the title while retaining body and guards concurrent edits', async () => {
    const f = fixture();
    await f.service.update(annId, { projectId, title: '' });
    const [filter, update] = f.model.findOneAndUpdate.mock.calls[0];
    expect(filter).toMatchObject({ _id: new Types.ObjectId(annId), projectId: new Types.ObjectId(projectId), __v: 0 });
    expect(update.$set.title).toBe('');
    expect(update.$set).not.toHaveProperty('message');
    expect(update.$inc).toEqual({ __v: 1 });
  });
  it('clears both text fields if a stored poll remains, without rewriting votes', async () => {
    const f = fixture({ title: 'Old', message: 'Body', poll, __v: 1 });
    await f.service.update(annId, { projectId, title: '', message: '' });
    expect(f.model.findOneAndUpdate.mock.calls[0][1].$set).toMatchObject({ title: '', message: '' });
    expect(f.model.findOneAndUpdate.mock.calls[0][1].$set).not.toHaveProperty('poll');
  });
  it('rejects removal of the final piece of content', async () => {
    const f = fixture({ title: 'Only', message: '', __v: 0 });
    await expect(f.service.update(annId, { projectId, title: '' })).rejects.toBeInstanceOf(BadRequestException);
    expect(f.model.findOneAndUpdate).not.toHaveBeenCalled();
  });
  it('rejects a stale concurrent edit', async () => {
    const f = fixture();
    f.query.exec.mockResolvedValue(null);
    await expect(f.service.update(annId, { projectId, title: '' })).rejects.toBeInstanceOf(ConflictException);
  });
});
