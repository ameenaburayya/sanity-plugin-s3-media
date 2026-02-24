/**
 * Checks whether or not the passed object is an object (and not `null`)
 *
 * @param obj Item to check whether or not is an object
 * @returns Whether or not `obj` is an object
 * @internal
 */
export function isObject(obj: unknown): obj is object {
  return obj !== null && !Array.isArray(obj) && typeof obj === 'object'
}
