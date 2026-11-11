// The registry: add each new episode here (one import, one entry).
import { rewind } from './rewind';
import { copyPaste } from './copy-paste';
import { shrink } from './shrink';
import { shrink60 } from './shrink60';

export const EPISODES = [rewind, copyPaste, shrink, ...shrink60];
