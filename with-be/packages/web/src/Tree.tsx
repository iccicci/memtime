import { type MouseEvent, useCallback, useState } from "react";

import type { Api } from "./api";
import { type Client, isLevel, type Page, type Project, type Task, type TreeLevel } from "./types";
import { usePagination } from "./usePagination";

type TreeItem = Client | Project | Task;
type TreeProps = TreeLevel & { isOpen?: boolean };

const DEFAULT_LEVEL: TreeProps = { level: "client" };

export const Tree = (props: TreeProps = DEFAULT_LEVEL) => {
  const { isOpen, level } = props;
  const [openIds, setOpenIds] = useState(() => new Set<number>());

  const fetchPage = useCallback(
    (api: Api, page: Page) =>
      isLevel(props, "client")
        ? api.getClients(page)
        : isLevel(props, "project")
          ? api.getClientProjects(props.clientId, page)
          : api.getProjectTasks(props.projectId, page),
    [props]
  );

  const { error, items, Load } = usePagination<TreeItem>(fetchPage, Boolean(isOpen));

  const toggleOpen = (id: number, event: MouseEvent<HTMLElement>) => {
    event.preventDefault();

    setOpenIds(prev => {
      const next = new Set(prev);

      if(next.has(id)) next.delete(id);
      else next.add(id);

      return next;
    });
  };

  return <div className={`tree tree--${level}`}>
    {error ? <p className="tree__error" role="alert">
      {error}
    </p> : null}

    <ul className="tree__list">
      {items.map(item => {
        if(level === "task") {
          return <li className="tree__item" key={item.id}>
            <span className="tree__label">{item.name}</span>
          </li>;
        }

        const open = openIds.has(item.id);

        return <li className="tree__item" key={item.id}>
          <details className="tree__branch" open={open}>
            <summary className="tree__summary" onClick={toggleOpen.bind(null, item.id)}>
              {item.name}
            </summary>
            {isLevel(props, "client") ? <Tree clientId={item.id} isOpen={open} level="project" /> : <Tree isOpen={open} level="task" projectId={item.id} />}
          </details>
        </li>;
      })}
    </ul>

    <Load />
  </div>;
};
