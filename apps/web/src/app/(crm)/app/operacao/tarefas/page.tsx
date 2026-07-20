import { Card } from "@pulso/ui";
import { PageHeader } from "@/components/page-header";
import { listTasks } from "../projetos/actions";
import { TaskCreateForm, TaskList } from "../projetos/[id]/task-panel";

export default async function TasksPage() {
  const tasks = await listTasks();

  const now = new Date();
  const overdue = tasks.filter((t) => t.dueAt && new Date(t.dueAt) < now && t.status !== "done");
  const rest = tasks.filter((t) => !overdue.includes(t));

  return (
    <>
      <PageHeader eyebrow="Operação" title="Tarefas" description="Tarefas gerais e por projeto, em um só lugar." />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {overdue.length > 0 && (
            <Card className="p-6">
              <h2 className="font-extrabold text-[var(--error)]">Atrasadas ({overdue.length})</h2>
              <div className="mt-4"><TaskList tasks={overdue} /></div>
            </Card>
          )}
          <Card className="p-6">
            <h2 className="font-extrabold">Todas as tarefas</h2>
            <div className="mt-4"><TaskList tasks={rest} /></div>
          </Card>
        </div>
        <Card className="h-fit p-6">
          <h2 className="font-extrabold">Nova tarefa</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">Tarefas vinculadas a um projeto são criadas na página do projeto.</p>
          <div className="mt-4"><TaskCreateForm projectId={null} /></div>
        </Card>
      </div>
    </>
  );
}
