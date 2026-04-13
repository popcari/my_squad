export interface FormationSlot {
  role: string;
  x: number; // 0-100
  y: number; // 0-100
}

export interface Formation {
  id: string;
  name: string;
  slots: FormationSlot[]; // length = 7
  createdAt: string;
  updatedAt: string;
}
