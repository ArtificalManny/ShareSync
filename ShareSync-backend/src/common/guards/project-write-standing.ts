import { ForbiddenException } from '@nestjs/common';
import { projectStanding } from './project-standing';

// openshare-project-write-standing-v1 (R53)
//
// Reading a project and changing it are different permissions.
//
// - assertProjectWriter: creating or changing shared project content (decisions,
//   commitments, approvals, handoffs, check-ins, responsibility entries, Team
//   Room threads and messages, Vault files and folders, ship updates and
//   project schedule sessions) needs a writer: the owner, or a member whose
//   role is owner, admin or member. Viewers, guests and spectators only read.
//
// - assertProjectMember: answering something addressed to you (deciding an
//   approval you were asked for, declining a handoff sent to you) or
//   withdrawing your own request needs current membership, with any role.
//   Spectators and people removed from the project can't.
//
// Both judge the project as just loaded from the database and the signed-in
// account, never what the client says about itself. They use the same rule as
// Moves (R51), read access (R52) and live updates (R52b): projectStanding().

export const READ_ONLY_MESSAGE =
  'This project is read-only for viewers and spectators';

export const MEMBERS_ONLY_MESSAGE =
  'Only current project members can do this';

export function assertProjectWriter(project: any, userId: unknown): void {
  if (projectStanding(project, String(userId ?? '')) !== 'writer') {
    throw new ForbiddenException(READ_ONLY_MESSAGE);
  }
}

export function assertProjectMember(project: any, userId: unknown): void {
  const standing = projectStanding(project, String(userId ?? ''));
  if (standing !== 'writer' && standing !== 'reader') {
    throw new ForbiddenException(MEMBERS_ONLY_MESSAGE);
  }
}
