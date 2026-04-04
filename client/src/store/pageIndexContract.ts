import { atom } from 'recoil';

export interface PageIndexPreviewState {
  previewPath: string;
  activePage: number | null;
  docName: string;
}

const pageIndexPreview = atom<PageIndexPreviewState | null>({
  key: 'pageIndexPreview',
  default: null,
});

export default {
  pageIndexPreview,
};
