import { type ChangeEvent, type SubmitEvent, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useApiContext } from "./ApiContext";
import { Back } from "./Back";
import type { ApiError, TimeEntry } from "./types";

const TASK_ID_RE = /^\d+$/;
const COMMENT_RE = /^(?!\s*$).+/;
const ISO_8601_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const TASK_VERIFY_DELAY_MS = 1000;

type Field = "taskId" | "comment" | "start" | "end";
type FieldErrors = { [key in Field]: string | null };

const EMPTY_ERRORS: FieldErrors = { comment: null, end: null, start: null, taskId: null };

const validateTaskId = (value: string): string | null => (TASK_ID_RE.test(value) ? null : "Must be a positive integer");

const validateComment = (value: string): string | null => (COMMENT_RE.test(value) ? null : "Comment is required");

const validateIso = (value: string): string | null => (ISO_8601_RE.test(value) ? null : "Must be ISO 8601 (e.g. 2024-01-15T09:00:00Z)");

const validateEnd = (end: string, start: string): string | null => {
  const endError = validateIso(end);

  if(endError) return endError;
  if(validateIso(start)) return null;
  if(! (Date.parse(end) > Date.parse(start))) return "End must be after start";

  return null;
};

const apiErrorMessage = (body: TimeEntry | ApiError | null, fallback: string) =>
  body && typeof body === "object" && "error" in body ? body.error : fallback;

export const TimeEntryForm = () => {
  const { id } = useParams();
  const isEdit = id !== undefined;
  const entryId = isEdit ? Number(id) : null;
  const { api } = useApiContext();
  const navigate = useNavigate();

  const [taskId, setTaskId] = useState("");
  const [comment, setComment] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [errors, setErrors] = useState<FieldErrors>(EMPTY_ERRORS);
  const [taskName, setTaskName] = useState<string | null>(null);
  const [taskVerified, setTaskVerified] = useState(false);
  const [verifyingTask, setVerifyingTask] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);
  const taskIdRef = useRef(taskId);
  const verifyTimeoutRef = useRef(0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    return () => {
      cancelledRef.current = true;
      window.clearTimeout(verifyTimeoutRef.current);
    };
  }, []);

  const loadTask = useCallback(
    async (taskId: string) => {
      const { body, code, status } = await api.getTask(Number(taskId));

      if(cancelledRef.current) return;

      if(code === 200 && "id" in body) {
        if(body.id !== Number(taskIdRef.current)) return;

        setTaskName(body.name);
        setErrors(prev => ({ ...prev, taskId: null }));
        setTaskVerified(true);
        setVerifyingTask(false);
        return;
      }

      if(taskIdRef.current !== taskId) return;

      setTaskName(null);
      setTaskVerified(false);
      setVerifyingTask(false);
      setErrors(prev => ({
        ...prev,
        taskId:
          code === 404
            ? apiErrorMessage(body as ApiError, "Task not found")
            : code === 429
              ? "Server is busy"
              : apiErrorMessage(body as ApiError, status)
      }));
    },
    [api]
  );

  useEffect(() => {
    if(! isEdit || entryId === null || Number.isNaN(entryId)) {
      if(isEdit) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(false);
        setLoadError("Invalid time entry id");
      }

      return;
    }

    const load = async () => {
      setLoading(true);
      setLoadError(null);

      const { body, code, status } = await api.getTimeEntry(entryId);

      if(cancelledRef.current) return;

      if(code !== 200 || ! ("id" in body)) {
        setLoading(false);

        if(code === 429) setLoadError("Server is busy. Please try again later.");
        else if(code === 404) setLoadError(apiErrorMessage(body, "Time entry not found"));
        else setLoadError(apiErrorMessage(body, status));

        return;
      }

      const { comment, end, start, taskId: loadedTaskId } = body;
      const value = String(loadedTaskId);

      setLoading(false);
      setTaskId(value);
      setComment(comment);
      setStart(start);
      setEnd(end);
      setErrors({
        comment: validateComment(comment),
        end:     validateEnd(end, start),
        start:   validateIso(start),
        taskId:  null
      });

      setVerifyingTask(true);
      taskIdRef.current = value;
      await loadTask(value);
    };

    void load();
  }, [api, entryId, isEdit, loadTask]);

  const onTaskIdChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
    taskIdRef.current = value;
    setTaskId(value);
    setTaskName(null);
    setTaskVerified(false);
    setSuccessId(null);
    window.clearTimeout(verifyTimeoutRef.current);

    const formalError = validateTaskId(value);

    if(formalError) {
      setVerifyingTask(false);
      setErrors(prev => ({ ...prev, taskId: formalError }));
      return;
    }

    setVerifyingTask(true);
    setErrors(prev => ({ ...prev, taskId: null }));
    verifyTimeoutRef.current = window.setTimeout(() => {
      void loadTask(value);
    }, TASK_VERIFY_DELAY_MS);
  };

  const onCommentChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
    setComment(value);
    setSuccessId(null);
    setErrors(prev => ({ ...prev, comment: validateComment(value) }));
  };

  const onStartChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
    setStart(value);
    setSuccessId(null);
    setErrors(prev => ({
      ...prev,
      end:   validateEnd(end, value),
      start: validateIso(value)
    }));
  };

  const onEndChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
    setEnd(value);
    setSuccessId(null);
    setErrors(prev => ({ ...prev, end: validateEnd(value, start) }));
  };

  const canSave =
    ! saving &&
    ! loading &&
    ! verifyingTask &&
    taskVerified &&
    errors.taskId === null &&
    errors.comment === null &&
    errors.start === null &&
    errors.end === null &&
    taskId !== "" &&
    comment !== "" &&
    start !== "" &&
    end !== "";

  const handleSubmit = useCallback(
    async (event: SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      if(! canSave) return;

      setSaving(true);
      setSubmitError(null);
      setSuccessId(null);

      const input = {
        comment: comment.trim(),
        end,
        start,
        taskId:  Number(taskId)
      };

      const result = isEdit && entryId !== null ? await api.updateTimeEntry(entryId, input) : await api.createTimeEntry(input);

      if(cancelledRef.current) return;

      const { body, code, status } = result;

      setSaving(false);

      if(code === 429) {
        setSubmitError("Server is busy. Please try again later.");
        return;
      }

      if(code === 400) {
        setSubmitError(apiErrorMessage(body, "Invalid JSON body"));
        return;
      }

      if(code === 404) {
        setSubmitError(apiErrorMessage(body, "Time entry not found"));
        return;
      }

      if((code !== 200 && code !== 201) || ! ("id" in body)) {
        setSubmitError(apiErrorMessage(body, status));
        return;
      }

      setSuccessId(body.id);
    },
    [api, canSave, comment, end, entryId, isEdit, start, taskId]
  );

  if(loading) {
    return <div className="home">
      <Back />
      <p className="loading">Loading...</p>
    </div>;
  }

  if(loadError) {
    return <div className="home">
      <Back />
      <p className="entry-form__error" role="alert">
        {loadError}
      </p>
    </div>;
  }

  return <div className="home">
    <Back />

    <form
      className="entry-form"
      onSubmit={event => {
        void handleSubmit(event);
      }}
    >
      <h2>{isEdit ? "Edit time entry" : "New time entry"}</h2>

      <label className="entry-form__field" htmlFor="task-id">
        {"Task ID"}
        <input autoComplete="off" id="task-id" name="taskId" onChange={onTaskIdChange} type="text" value={taskId} />
        {verifyingTask ? <span className="entry-form__field-hint" role="status">
          {"Verifying task..."}
        </span> : errors.taskId ? <span className="entry-form__field-error" role="status">
          {errors.taskId}
        </span> : taskName ? <span className="entry-form__field-hint" role="status">
          {taskName}
        </span> : null}
      </label>

      <label className="entry-form__field" htmlFor="comment">
        {"Comment"}
        <input autoComplete="off" id="comment" name="comment" onChange={onCommentChange} type="text" value={comment} />
        {errors.comment ? <span className="entry-form__field-error" role="status">
          {errors.comment}
        </span> : null}
      </label>

      <label className="entry-form__field" htmlFor="start">
        {"Start"}
        <input autoComplete="off" id="start" name="start" onChange={onStartChange} placeholder="2024-01-15T09:00:00Z" type="text" value={start} />
        {errors.start ? <span className="entry-form__field-error" role="status">
          {errors.start}
        </span> : null}
      </label>

      <label className="entry-form__field" htmlFor="end">
        {"End"}
        <input autoComplete="off" id="end" name="end" onChange={onEndChange} placeholder="2024-01-15T17:00:00Z" type="text" value={end} />
        {errors.end ? <span className="entry-form__field-error" role="status">
          {errors.end}
        </span> : null}
      </label>

      {submitError ? <p className="entry-form__error" role="alert">
        {submitError}
      </p> : null}

      {successId !== null ? <p className="entry-form__success" role="status">
        {isEdit ? `Time entry #${successId} updated successfully.` : `Time entry created successfully with id #${successId}.`}{" "}
        <button
          className="entry-form__success-link"
          onClick={() => {
            void navigate("/time-entries");
          }}
          type="button"
        >
          {"View time entries"}
        </button>
      </p> : null}

      <button disabled={! canSave} type="submit">
        {saving ? "Saving..." : "Save"}
      </button>
    </form>
  </div>;
};
