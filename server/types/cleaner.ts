export interface Cleaner {
  id: string;
  name: string;
  phone: string; // for SMS reminders (future)
  password: string; // simple shared secret for cleaner login
  createdAt: string;
}
