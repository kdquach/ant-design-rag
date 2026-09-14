export interface Source {
  component: string;
  url: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}
