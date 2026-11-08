import { Link } from "react-router-dom";

export const Home = () => <nav className="home">
  <ul className="home__links">
    <li>
      <Link to="/browse">Browse clients, projects and tasks</Link>
    </li>
    <li>
      <Link to="/time-entries">View time entries</Link>
    </li>
    <li>
      <Link to="/time-entries/new">New time entry</Link>
    </li>
  </ul>
</nav>;
