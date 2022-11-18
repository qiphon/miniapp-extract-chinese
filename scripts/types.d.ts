interface ChildNode {
  tagName: string;
  data: string;
  attribs: Record<string, string>;
  nodeType: number;
  childNodes: ChildNode[];
}
