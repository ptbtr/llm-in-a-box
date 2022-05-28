import * as t from "io-ts";
import reporter from "io-ts-reporters";
import { isLeft } from "fp-ts/Either";

export const unwrapOrRaise = <T>(result: t.Validation<T>, msg: string): T => {
  if (isLeft(result)) {
    const errors = reporter.report(result).join("\n - ");
    throw new Error(`${msg}:\n - ${errors}`);
  } else {
    return result.right;
  }
};
