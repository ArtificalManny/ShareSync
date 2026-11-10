import { Types } from 'mongoose';
import { TasksService } from './tasks.service';

// openshare-moves-member-projects-v1 (R51)

const userId = '507f191e810c19729de860ea';
const projectId = '507f1f77bcf86cd799439011';
const mine = [new Types.ObjectId('64b7f0c2a1b2c3d4e5f60718'), new Types.ObjectId('64b7f0c2a1b2c3d4e5f60719')];

function harness(options: { memberProjects?: any[]; rejectProjects?: boolean } = {}) {
  const calls: any = { query: null, skip: null, limit: null, count: null, priorityQuery: null };

  const lean = jest.fn().mockResolvedValue([]);
  const limit = jest.fn().mockImplementation((value: number) => { calls.limit = value; return { lean }; });
  const skip = jest.fn().mockImplementation((value: number) => { calls.skip = value; return { limit }; });
  const sort = jest.fn().mockReturnValue({ skip });

  const priorityExec = jest.fn().mockResolvedValue([]);
  const priorityChain = {
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: priorityExec,
  };

  const taskModel: any = {
    find: jest.fn().mockImplementation((query: any) => {
      if (query && query.$or) {
        calls.priorityQuery = query;
        return priorityChain;
      }
      calls.query = query;
      return { sort };
    }),
    countDocuments: jest.fn().mockImplementation(async (query: any) => { calls.count = query; return 0; }),
  };

  const projectExec = jest.fn().mockImplementation(async () => {
    if (options.rejectProjects) throw new Error('database down');
    return (options.memberProjects ?? mine).map((_id) => ({ _id }));
  });
  const projectModel: any = {
    find: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ lean: () => ({ exec: projectExec }) }) }),
  };

  const projectsService: any = { findByIdWithAccess: jest.fn().mockResolvedValue({ _id: projectId }) };

  const service = new TasksService(
    taskModel,
    projectModel,
    projectsService,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );

  return { service, calls, taskModel, projectModel, projectsService };
}

describe('R51 Move lists without a project', () => {
  it('lists only Moves from the projects the user owns or belongs to', async () => {
    const h = harness();
    await h.service.find(userId, { search: 'estate' });
    expect(h.calls.query.projectId).toEqual({ $in: mine });
    expect(h.calls.count).toEqual(h.calls.query);
    expect(h.projectsService.findByIdWithAccess).not.toHaveBeenCalled();
  });

  it('looks the projects up by owner and by membership, under every field the app uses', async () => {
    const h = harness();
    await h.service.find(userId, {});
    const filter = h.projectModel.find.mock.calls[0][0];
    const user = new Types.ObjectId(userId);
    expect(filter).toEqual({
      $or: [
        { ownerId: user },
        { owner: user },
        { createdBy: user },
        { createdById: user },
        { members: user },
        { 'members.userId': user },
        { 'members.user': user },
        { 'members.memberId': user },
      ],
    });
  });

  it('finds nothing for a user without projects', async () => {
    const h = harness({ memberProjects: [] });
    await h.service.find(userId, { status: 'done' as any });
    expect(h.calls.query.projectId).toEqual({ $in: [] });
  });

  it('finds nothing, without a database query, for a malformed user', async () => {
    const h = harness();
    await h.service.find('not-an-id', {});
    expect(h.calls.query.projectId).toEqual({ $in: [] });
    expect(h.projectModel.find).not.toHaveBeenCalled();
  });

  it('fails instead of listing everything when the project lookup fails', async () => {
    const h = harness({ rejectProjects: true });
    await expect(h.service.find(userId, {})).rejects.toThrow('database down');
    expect(h.taskModel.find).not.toHaveBeenCalled();
  });

  it('keeps a project\'s own list as before: checked and limited to that project', async () => {
    const h = harness();
    await h.service.find(userId, { projectId });
    expect(h.projectsService.findByIdWithAccess).toHaveBeenCalledWith(projectId, userId);
    expect(h.calls.query.projectId).toEqual(new Types.ObjectId(projectId));
    expect(h.projectModel.find).not.toHaveBeenCalled();
  });

  it.each([
    [undefined, 50],
    [5, 5],
    [200, 200],
    [201, 200],
    [100000, 200],
    [0, 1],
    [-3, 1],
    [2.9, 2],
    [Number.NaN, 50],
    [Number.POSITIVE_INFINITY, 50],
  ])('returns at most 200 Moves (limit %p becomes %p)', async (requested, expected) => {
    const h = harness();
    await h.service.find(userId, requested === undefined ? {} : { limit: requested as number });
    expect(h.calls.limit).toBe(expected);
  });

  it.each([
    [undefined, 0],
    [10, 10],
    [-5, 0],
    [Number.NaN, 0],
    [3.7, 3],
  ])('never skips a negative number of Moves (offset %p becomes %p)', async (requested, expected) => {
    const h = harness();
    await h.service.find(userId, requested === undefined ? {} : { offset: requested as number });
    expect(h.calls.skip).toBe(expected);
  });
});

describe('R51 priorities without a project', () => {
  it('only include Moves from projects the user still owns or belongs to', async () => {
    const h = harness();
    await h.service.getMyPriorityTasks(userId, 3);
    expect(h.calls.priorityQuery.projectId).toEqual({ $in: mine });
    expect(h.projectsService.findByIdWithAccess).not.toHaveBeenCalled();
  });

  it('still only include the user\'s own Moves', async () => {
    const h = harness();
    await h.service.getMyPriorityTasks(userId, 3);
    const user = new Types.ObjectId(userId);
    expect(h.calls.priorityQuery.$or).toEqual(expect.arrayContaining([{ assigneeId: user }, { reporterId: user }, { createdBy: user }]));
  });

  it('keep a project\'s own priorities as before', async () => {
    const h = harness();
    await h.service.getMyPriorityTasks(userId, 3, projectId);
    expect(h.projectsService.findByIdWithAccess).toHaveBeenCalledWith(projectId, userId);
    expect(h.calls.priorityQuery.projectId).toEqual(new Types.ObjectId(projectId));
    expect(h.projectModel.find).not.toHaveBeenCalled();
  });
});
