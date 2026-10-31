import { type FC, useCallback, useEffect, useRef, useState } from "react";

import { type Api, type ApiFetchResult } from "./api";
import { useApiContext } from "./ApiContext";
import { Loading } from "./Loading";
import { LoadMore } from "./LoadMore";
import type { ApiError, Page } from "./types";

const PAGE_LIMIT = 3;

type FetchPage<T> = (api: Api, page: Page) => Promise<ApiFetchResult<T[] | ApiError>>;

export const usePagination = <T,>(fetchPage: FetchPage<T>, enabled = true) => {
  const { api, serverBusy } = useApiContext();
  const [items, setItems] = useState<T[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canceled = useRef(false);

  useEffect(() => {
    canceled.current = false;

    return () => {
      canceled.current = true;
    };
  }, []);

  const loadPage = useCallback(async () => {
    if(pending || ! hasMore) return;

    setPending(true);
    setError(null);

    const result = await fetchPage(api, { limit: PAGE_LIMIT, offset });

    if(canceled.current) return;

    setPending(false);

    const { body, code, status } = result;

    if(code === 429) return;
    if(code !== 200 || ! Array.isArray(body)) setError(status);
    else {
      setItems(prev => (offset === 0 ? body : [...prev, ...body]));
      setOffset(offset + body.length);
      setHasMore(body.length === PAGE_LIMIT);
    }
  }, [api, fetchPage, offset, hasMore, pending]);

  useEffect(() => {
    if(enabled && offset === 0 && ! serverBusy) void loadPage();
  }, [enabled, offset, serverBusy, loadPage]);

  const loadMore = useCallback(() => {
    // eslint-disable-next-line no-console
    loadPage().catch(error => console.error(error));
  }, [loadPage]);

  const Load: FC = useCallback(() => (hasMore ? pending ? <Loading /> : <LoadMore onClick={loadMore} /> : null), [hasMore, pending, loadMore]);

  return { Load, error, items };
};
