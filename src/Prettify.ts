/**
 * unfolds a type for cleaner display to the end user.
 * @param T the type to expand into its resolved form.
 * @param Recursive whether or not to apply the helper recursively; can resolve some messiness for especially complex type definitions, but may also make circular types and ones that reference others less readable
 */
export type Prettify<T, Recursive extends true | false = false> = {
	[K in keyof T]: Recursive extends true
		? T[K] extends object
			? Prettify<T[K]>
			: T[K]
		: T[K];
} & {};
