import * as ts from 'typescript';

export function rewriteTsdoc(
  ctx: ts.TransformationContext,
): ts.Transformer<ts.SourceFile> {
  return (file: ts.SourceFile): ts.SourceFile => {
    const result = ts.visitNode(file, visitor);

    // const printer = ts.createPrinter();
    // console.log(`TRANSFORMED:\n${printer.printFile(result)}`);

    return result;

    function visitor(node: ts.Node): ts.Node {
      if (ts.isClassDeclaration(node)) {
        ts.forEachLeadingCommentRange(
          node.getFullText(file),
          0,
          (pos, end, kind, hasTrailingNewLine) => {
            const commentText = file.text.slice(pos, end);
            if (
              kind !== ts.SyntaxKind.MultiLineCommentTrivia ||
              !commentText.startsWith('/**')
            ) {
              return node;
            }

            const newComment = `* EXPERIMENTAL API ${commentText.slice(
              3,
              commentText.length - 3,
            )}`;

            // Replace old comment range with just white space, so it's neutral
            file.text =
              file.text.slice(0, pos).padEnd(end, ' ') + file.text.slice(end);

            // Now adding a new synthetic comment as a replacement
            return ts.addSyntheticLeadingComment(
              ts.updateClassDeclaration(
                node,
                node.decorators,
                node.modifiers,
                node.name,
                node.typeParameters,
                node.heritageClauses,
                node.members,
              ),
              kind,
              newComment,
              hasTrailingNewLine,
            );
          },
        );
      }
      return ts.visitEachChild(node, visitor, ctx);
    }
  };
}
