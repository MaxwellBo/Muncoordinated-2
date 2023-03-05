import {ResolutionID} from "./resolution";

export enum PostType {
  Link = 'link',
  File = 'arquivo',
  Text = 'texto'
}

export type PostID = string;

export interface Post {
  type: PostType
  uploader: string;
  forResolution?: ResolutionID
  timestamp?: number; // we're just going to have to cop the undefined here
}

export interface Link extends Post {
  type: PostType.Link;
  url: string;
  name: string;
}

export interface File extends Post {
  type: PostType.File;
  filename: string;
}

export interface Text extends Post {
  type: PostType.Text;
  body: string;
}

export type PostData = Link | File | Text;