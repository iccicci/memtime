import { Link } from "react-router-dom";

import type { Api } from "./api";
import { Back } from "./Back";
import type { Page, TimeEntry } from "./types";
import { usePagination } from "./usePagination";

const fetchPage = (api: Api, page: Page) => api.getTimeEntries(page);

export const TimeEntries = () => {
  const { Load, error, items } = usePagination<TimeEntry>(fetchPage);

  return <div className="home">
    <Back />

    {error ? <p className="time-entries__error" role="alert">
      {error}
    </p> : null}

    <br />
    <br />

    <Link className="time-entries__new" to="/time-entries/new">
      {"New time entry"}
    </Link>

    <div className="time-entries">
      <table className="time-entries__table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Task ID</th>
            <th>Comment</th>
            <th>Start</th>
            <th>End</th>
            <th>Created At</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map(entry => <tr key={entry.id}>
            <td>{entry.id}</td>
            <td>{entry.taskId}</td>
            <td>{entry.comment}</td>
            <td>{entry.start}</td>
            <td>{entry.end}</td>
            <td>{entry.createdAt}</td>
            <td>
              <Link className="time-entries__edit" to={`/time-entries/${entry.id}/edit`}>
                {"Edit"}
              </Link>
            </td>
          </tr>)}
        </tbody>
      </table>
    </div>

    <Load />
  </div>;
};
