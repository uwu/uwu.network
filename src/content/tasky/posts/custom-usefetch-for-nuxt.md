---
title: Custom useFetch for Nuxt
description: A custom useFetch that supports wrapping while keeping the type inference
date: 2025-06-25
published: true
---

Nuxt’s useFetch composable is pretty cool. One great feature it has is that it’s able to autocomplete your API calls from Nitro (it’s backend framework) and automatically infer the type of the response. However, if you want to write a custom wrapper for it, you lose that feature, which is a bummer.

One provided solution was to replicating the type of useFetch, something like:

```diff
- export function useCustomFetch<T> (url: string, options?: UseFetchOptions<T>): Promise<AsyncData<T>>
+ export const useCustomFetch: typeof useFetch = function useCustomFetch<T> (url: string, options?: UseFetchyOptions<T>): Promise<AsyncData<T>>
```

However, now you can’t customize the parameters given to useFetch like options. Unless.... you do the following type-dance! It's not the best, but certainly not terrible.

You probably want to take the type declarations out and put them in a separate .d.ts file, but I will keep them in the same file here so you can easily copy.

Cheers!

```ts
import { useToast } from '@/composables/use-toast'
import type {
  AvailableRouterMethod as _AvailableRouterMethod,
  NitroFetchRequest
} from 'nitropack'
import type { AsyncData, FetchResult, UseFetchOptions } from 'nuxt/app'
import type { FetchError } from 'ofetch'

// Custom options
interface UseFetchyOptions<
  _ResT,
  DataT,
  PickKeys extends KeysOf<DataT>,
  DefaultT,
  ReqT extends NitroFetchRequest,
  Method extends AvailableRouterMethod<ReqT>
> extends UseFetchOptions<_ResT, DataT, PickKeys, DefaultT, ReqT, Method> {
  alert?: boolean
  suppress?: boolean
}

type PickFrom<T, K extends Array<string>> = T extends Array<any> ? T
  : T extends Record<string, any> ? keyof T extends K[number] ? T
    : K[number] extends never ? T
    : Pick<T, K[number]>
  : T

type KeysOf<T> = Array<
  T extends T ? (keyof T extends string ? keyof T : never) : never
>

type AvailableRouterMethod<R extends NitroFetchRequest> =
  | _AvailableRouterMethod<R>
  | Uppercase<_AvailableRouterMethod<R>>

export async function useFetchy<
  ResT = void,
  ErrorT = FetchError,
  ReqT extends NitroFetchRequest = NitroFetchRequest,
  Method extends AvailableRouterMethod<ReqT> = ResT extends void
    ? 'get' extends AvailableRouterMethod<ReqT> ? 'get'
    : AvailableRouterMethod<ReqT>
    : AvailableRouterMethod<ReqT>,
  _ResT = ResT extends void ? FetchResult<ReqT, Method> : ResT,
  DataT = _ResT,
  PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
  DefaultT = DataT
>(
  request: Ref<ReqT> | ReqT | (() => ReqT),
  opts: UseFetchyOptions<_ResT, DataT, PickKeys, DefaultT, ReqT, Method> = {}
): Promise<AsyncData<PickFrom<DataT, PickKeys> | DefaultT, ErrorT | null>> {
  const toast = useToast()

  opts.alert = opts.alert ?? true
  opts.suppress = opts.suppress ?? true

  let successMessage = ''
  let errorMessage = ''

  const result = await useFetch<
    ResT,
    ErrorT,
    ReqT,
    Method,
    _ResT,
    DataT,
    PickKeys,
    DefaultT
  >(request, {
    ...opts,
    onResponse({ response }) {
      if (response.ok) {
        successMessage = response._data?.message
      } else {
        errorMessage = response._data?.message || response.statusText
      }
    }
  })

  if (opts.alert && errorMessage) {
    toast.error(errorMessage, {
      title: 'Something went wrong',
      timeout: 5000
    })
  }

  if (opts.alert && successMessage) {
    toast.success(successMessage, {
      title: 'Success',
      timeout: 2000
    })
  }

  if (!opts.suppress && result.error.value) {
    throw result.error.value
  }

  return result
}
```
