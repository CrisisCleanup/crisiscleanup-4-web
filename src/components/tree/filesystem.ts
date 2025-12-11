import { Tree, type TreeVisitor, TreeNode } from './node';
import type { CCUFileItem } from '@/models/types';

abstract class FileSystemNode<T> extends TreeNode<T> {
  constructor(
    public value: T,
    public parent?: FileSystemNode<T> | undefined,
  ) {
    super(value, parent);
  }

  get path(): string {
    return (this.parent ? [this.parent.name, this.name] : [this.name]).join(
      '/',
    );
  }

  abstract get name(): string;

  traverse(visitor: TreeVisitor<T>) {
    visitor(this);
    for (const child of this.children) child.traverse(visitor);
  }
}

export class FolderNode extends FileSystemNode<string> {
  get name(): string {
    return this.value;
  }
}

export class FileNode<T extends CCUFileItem> extends FileSystemNode<T> {
  get name(): string {
    return this.value.filename_original;
  }
}
