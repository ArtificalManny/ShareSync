import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Project extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  category: string;

  @Prop({ default: 'In Progress' })
  status: string;

  @Prop({ type: [{ user: String, role: String }], default: [] })
  members: { user: string; role: string }[];

  @Prop({ type: [{ name: String, description: String, members: [String] }], default: [] })
  teams: { name: string; description: string; members: string[] }[];

  @Prop({ type: [{ message: String, type: String, pollOptions: [{ option: String, votes: [String] }], pictureUrl: String, timestamp: Date, likes: [String], shares: [String], comments: [{ user: String, text: String, timestamp: Date }] }], default: [] })
  announcements: any[];

  @Prop()
  snapshot: string;

  @Prop({ type: [{ title: String, description: String, status: String, assignedTo: [String], assignedTeams: [String], subtasks: [{ title: String, status: String, assignedTo: [String] }], likes: [String], shares: [String], comments: [{ user: String, text: String, timestamp: Date }] }], default: [] })
  tasks: any[];

  @Prop({ type: [{ name: String, url: String, status: String, likes: [String], shares: [String] }], default: [] })
  files: any[];

  @Prop({ type: [{ type: String, message: String, timestamp: Date }], default: [] })
  teamActivities: any[];

  @Prop({ type: { emailNotifications: Boolean, smsNotifications: Boolean, projectUpdates: Boolean, taskAssignments: Boolean, comments: Boolean, fileUploads: Boolean }, default: { emailNotifications: true, smsNotifications: true, projectUpdates: true, taskAssignments: true, comments: true, fileUploads: true } })
  notificationSettings: any;

  @Prop({ type: [{ title: String, content: String, category: String, timestamp: Date }], default: [] })
  posts: any[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);