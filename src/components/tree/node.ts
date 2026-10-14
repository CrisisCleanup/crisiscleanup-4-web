import type { Class } from 'type-fest';

export interface TreeVisitor<T> {
  (node: TreeNode<T>): void;
}

export abstract class TreeNode<T> {
  children: TreeNode<T>[] = [];

  constructor(
    public value: T,
    public parent?: TreeNode<T> | undefined,
  ) {}

  add(...node: TreeNode<T>[]): this {
    for (const n of node) {
      n.parent = this;
      this.children.push(n);
    }
    return this;
  }

  clone(): TreeNode<T> {
    const node = new (this.constructor as Class<TreeNode<T>>)(this.value);
    node.parent = undefined;
    for (const child of this.children) node.add(child.clone());
    return node;
  }

  get isLeaf(): boolean {
    return this.children.length === 0;
  }

  abstract traverse(visitor: TreeVisitor<T>): void;
}

export class Tree<T> {
  constructor(public root: TreeNode<T>) {}

  traverse(visitor: TreeVisitor<T>): void {
    this.root.traverse(visitor);
  }

  dfs(visitor: TreeVisitor<T>): void {
    const stack = [this.root];
    while (stack.length > 0) {
      const currentNode = stack.pop()!;
      visitor(currentNode);
      stack.push(...currentNode.children.reverse());
    }
  }

  bfs(visitor: TreeVisitor<T>): void {
    const queue = [this.root];
    while (queue.length > 0) {
      const currentNode = queue.shift()!;
      visitor(currentNode);
      queue.push(...currentNode.children);
    }
  }
}

export const findUniqueNodeTypes = <T>(tree: Tree<T>): Set<string> => {
  const types = new Set<string>();
  tree.traverse((node) => {
    types.add(node.constructor.name);
  });
  return types;
};
