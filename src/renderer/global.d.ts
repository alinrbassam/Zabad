/// <reference types="vite/client" />
import { WindowApi } from '../preload/api';

declare global {
  interface Window {
    api: WindowApi;
  }
}

