enum VisitResult {
    SkipChildren,
    SkipRest,
    Continue,
}

export abstract class MarkdownNode {
    children: MarkdownNode[];
    text: string | null;
    parent: MarkdownNode | null;
    level: number;

    constructor(text: string, level: number) {
        this.text = text;
        this.level = level;
        this.children = [];
    }

    append(node: MarkdownNode) {
        node.parent = this;
        this.children.push(node);
    }

    appendFirst(child: MarkdownNode) {
        this.children.unshift(child);
        child.parent = this;
    }

    appendSibling(node: MarkdownNode) {
        const indexOfThis = this.parent.children.findIndex((b) => b === this);
        this.parent.children.splice(indexOfThis + 1, 0, node);
    }

    remove(child: MarkdownNode) {
        child.parent = null;
        this.children.splice(this.children.indexOf(child), 1);
    }

    removeSelf() {
        this.parent.remove(this);
    }

    getNthAncestor(targetLevel: number) {
        let pointer = this as MarkdownNode;

        for (let level = 0; level < targetLevel; level++) {
            pointer = pointer.parent;
        }

        return pointer;
    }

    // walkNodeTree(visitor: (node: MarkdownNode) => VisitResult) {
    //     let visitResult = visitor(this);
    //     if (visitResult === VisitResult.SkipRest) {
    //         return visitResult
    //     }
    //     for (const child of this.children) {
    //         visitResult = child.walkNodeTree(visitor);
    //         if (visitResult === VisitResult.SkipRest) {
    //             return visitResult
    //         }
    //     }
    // }

    abstract stringify(): string[];
}
