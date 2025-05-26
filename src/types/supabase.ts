export type PostgrestError = {
  code: string;
  details: string | null;
  hint: string | null;
  message: string;
};
