import type { TreeNode } from './node';
import { findUniqueNodeTypes, Tree } from './node';
import type { FunctionalComponent, Slot, VNode } from 'vue';

export const RenderTree: FunctionalComponent<{
  tree: Tree<any>;
  seen?: Set<any>;
  sub?: boolean;
}> = (props, context) => {
  const nodeTypes = computed(() => [...findUniqueNodeTypes(props.tree)]);

  const vnodes: [Slot, { node: TreeNode<any>; subtree?: VNode }][] = [];

  const slotV = Object.fromEntries(
    nodeTypes.value.map((nt) => [nt, context.slots[nt]]),
  );
  console.log('slotv:', slotV);

  // const seen = props.seen ?? new Set<TreeNode<any>>();
  let seen = toRef(props, 'seen');
  seen = seen?.value ?? ref(new Set());

  props.tree.dfs((node) => {
    // if (props.sub) return;
    // if (seen.value.has(node)) return;
    seen.value.add(node);
    const slot = slotV[node.constructor.name] ?? context.slots.default;
    if (slot) {
      const subtree = node.isLeaf ? undefined : new Tree(node.clone());
      vnodes.push([slot, { node, subtree, self: slot, seen: seen.value }]);
    }
  });

  return (
    <div>
      {{
        default: () => vnodes.map(([slot, slotProps]) => slot(slotProps)),
      }}
    </div>
  );
};

RenderTree.props = {
  tree: {
    type: Object,
    required: true,
  },
};
