import type { InjectionKey, Ref } from 'vue';

export interface RAGAdminContext {
  collectionId: Ref<string | undefined>;
}

export const RAGAdminContextKey: InjectionKey<RAGAdminContext> =
  Symbol('RAGAdminContext');
