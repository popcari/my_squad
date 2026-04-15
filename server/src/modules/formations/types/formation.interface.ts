export interface FormationSlot {
  role: string;
  x: number; // 0-100, horizontal position on pitch
  y: number; // 0-100, vertical position (0 = own goal, 100 = opponent goal)
}

export interface Formation {
  id: string;
  name: string;
  slots: FormationSlot[];
  createdAt: Date;
  updatedAt: Date;
}
