import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type HabitsPrefsDocument = HydratedDocument<HabitsPrefs>;
export type ReflectionDocument  = HydratedDocument<Reflection>;
export type NudgeDismissalDocument = HydratedDocument<NudgeDismissal>;

@Schema({ collection: 'habits_prefs', timestamps: true })
export class HabitsPrefs {
  @Prop({ required: true, index: true }) userId: string;

  // 0..6 => Sun..Sat ; default Mon–Fri
  @Prop({ type: [Number], default: [1,2,3,4,5] })
  workdays: number[];

  // Optional hours (24h, local user timezone implied)
  @Prop({ type: Object, default: { start: '09:00', end: '17:00' } })
  workHours: { start?: string; end?: string };

  @Prop({ type: Object, default: { start: '22:00', end: '07:00' } })
  quietHours: { start?: string; end?: string };

  @Prop({
    type: Object,
    default: { sprint: true, update: true, convertTask: true },
  })
  nudges: { sprint?: boolean; update?: boolean; convertTask?: boolean };

  @Prop({ type: Object, default: { day: 5, time: '16:00' } }) // Fri 4pm
  weeklyReminder: { day?: number; time?: string };
}
export const HabitsPrefsSchema = SchemaFactory.createForClass(HabitsPrefs);

@Schema({ collection: 'habits_reflections', timestamps: true })
export class Reflection {
  @Prop({ required: true, index: true }) userId: string;
  // ISO week key e.g. "2025-36"
  @Prop({ required: true, index: true }) weekOf: string;
  @Prop({ type: [String], default: [] }) wins: string[];
  @Prop({ default: '' }) focus: string;
}
export const ReflectionSchema = SchemaFactory.createForClass(Reflection);

@Schema({ collection: 'nudges_dismissed', timestamps: true })
export class NudgeDismissal {
  @Prop({ required: true, index: true }) userId: string;
  // arbitrary key you decide in frontend (e.g. "suggest.startSprint.2025-09-07")
  @Prop({ required: true, index: true }) nudgeId: string;
  @Prop({ default: Date.now }) dismissedAt: Date;
}
export const NudgeDismissalSchema = SchemaFactory.createForClass(NudgeDismissal);
