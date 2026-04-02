import { useRecoilValue } from 'recoil';
import { useEffect, useMemo } from 'react';
import { FileSources, LocalStorageKeys } from 'librechat-data-provider';
import type { ExtendedFile } from '~/common';
import { useDeleteFilesMutation } from '~/data-provider';
import DragDropWrapper from '~/components/Chat/Input/Files/DragDropWrapper';
import { EditorProvider, SidePanelProvider, ArtifactsProvider, useChatContext } from '~/Providers';
import Artifacts from '~/components/Artifacts/Artifacts';
import {
  DraftingPreviewPanel,
  isDocDraftingConversation,
  useDraftingSession,
} from '~/features/agents/doc-drafting';
import {
  isWillDraftingConversation,
  useWillDownloadUrl,
  WillPreviewPanel,
} from '~/features/agents/wills';
import { SidePanelGroup } from '~/components/SidePanel';
import { useSetFilesToDelete } from '~/hooks';
import store from '~/store';

export default function Presentation({ children }: { children: React.ReactNode }) {
  const artifacts = useRecoilValue(store.artifactsState);
  const artifactsVisibility = useRecoilValue(store.artifactsVisibility);
  const { conversation } = useChatContext();
  const { session: draftingSession } = useDraftingSession();

  // Detect Will Drafting conversation and look for generated download URL
  const isWillConvo = isWillDraftingConversation(conversation);
  const convId = (isWillConvo ? conversation?.conversationId : '') ?? '';
  const willDownloadUrl = useWillDownloadUrl(convId);
  const isDocDraftingConvo = isDocDraftingConversation(conversation, conversation?.model);
  const docDraftingDownloadUrl = isDocDraftingConvo ? draftingSession.lastDraft?.downloadUrl ?? '' : '';

  const setFilesToDelete = useSetFilesToDelete();

  const { mutateAsync } = useDeleteFilesMutation({
    onSuccess: () => {
      console.log('Temporary Files deleted');
      setFilesToDelete({});
    },
    onError: (error) => {
      console.log('Error deleting temporary files:', error);
    },
  });

  useEffect(() => {
    const filesToDelete = localStorage.getItem(LocalStorageKeys.FILES_TO_DELETE);
    const map = JSON.parse(filesToDelete ?? '{}') as Record<string, ExtendedFile>;
    const files = Object.values(map)
      .filter(
        (file) =>
          file.filepath != null && file.source && !(file.embedded ?? false) && file.temp_file_id,
      )
      .map((file) => ({
        file_id: file.file_id,
        filepath: file.filepath as string,
        source: file.source as FileSources,
        embedded: !!(file.embedded ?? false),
      }));

    if (files.length === 0) {
      return;
    }
    mutateAsync({ files });
  }, [mutateAsync]);

  const defaultLayout = useMemo(() => {
    const resizableLayout = localStorage.getItem('react-resizable-panels:layout');
    return typeof resizableLayout === 'string' ? JSON.parse(resizableLayout) : undefined;
  }, []);
  const defaultCollapsed = useMemo(() => {
    const collapsedPanels = localStorage.getItem('react-resizable-panels:collapsed');
    return typeof collapsedPanels === 'string' ? JSON.parse(collapsedPanels) : true;
  }, []);
  const fullCollapse = useMemo(() => localStorage.getItem('fullPanelCollapse') === 'true', []);

  /**
   * Memoize artifacts JSX to prevent recreating it on every render
   * This is critical for performance - prevents entire artifact tree from re-rendering
   */
  const artifactsElement = useMemo(() => {
    if (artifactsVisibility === true && Object.keys(artifacts ?? {}).length > 0) {
      return (
        <ArtifactsProvider>
          <EditorProvider>
            <Artifacts />
          </EditorProvider>
        </ArtifactsProvider>
      );
    }
    return null;
  }, [artifactsVisibility, artifacts]);

  /** Only show the Will Preview panel once the DOCX has been generated */
  const willPreviewElement = useMemo(() => {
    if (willDownloadUrl) {
      return <WillPreviewPanel downloadUrl={willDownloadUrl} />;
    }
    return null;
  }, [willDownloadUrl]);

  const docDraftingPreviewElement = useMemo(() => {
    if (docDraftingDownloadUrl) {
      return <DraftingPreviewPanel downloadUrl={docDraftingDownloadUrl} />;
    }
    return null;
  }, [docDraftingDownloadUrl]);

  return (
    <DragDropWrapper className="relative flex w-full grow overflow-hidden bg-presentation">
      <SidePanelProvider>
        <SidePanelGroup
          defaultLayout={defaultLayout}
          fullPanelCollapse={fullCollapse}
          defaultCollapsed={defaultCollapsed}
          artifacts={artifactsElement ?? docDraftingPreviewElement ?? willPreviewElement}
        >
          <main className="flex h-full flex-col overflow-y-auto" role="main">
            {children}
          </main>
        </SidePanelGroup>
      </SidePanelProvider>
    </DragDropWrapper>
  );
}
