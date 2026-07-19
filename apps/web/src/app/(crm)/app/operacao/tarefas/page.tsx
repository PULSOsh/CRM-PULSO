import { Card, Badge } from "@pulso/ui";
import { CalendarDays, Check, Clock3, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";

const days = ["19 DOM", "20 SEG", "21 TER", "22 QUA", "23 QUI"];
const tasks = [
  ["09:00", "Revisar briefing da Clínica Horizonte", "Comercial", "alta"],
  ["11:30", "Enviar aprovação do layout Atlas", "Projeto", "normal"],
  ["15:00", "Follow-up proposta Studio Cais", "Comercial", "normal"]
];

export default function TasksPage() {
  return (
    <>
      <PageHeader eyebrow="Operação" title="Tarefas e calendário" description="Agenda interna com sincronização opcional ao Google Calendar."
        actions={<button className="primary-button"><Plus className="size-4" />Nova tarefa</button>} />
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card className="overflow-hidden">
          <div className="grid grid-cols-5 border-b border-[var(--line)] bg-[var(--soft)]">
            {days.map((day,index)=><div key={day} className={`p-4 text-center font-mono text-[10px] font-bold ${index===0?"bg-[var(--carbon)] text-white":""}`}>{day}</div>)}
          </div>
          <div className="min-h-[520px] bg-[linear-gradient(var(--line)_1px,transparent_1px)] bg-[length:100%_72px] p-4">
            {tasks.map((task,index)=>(
              <div key={task[1]} className="mb-3 flex items-center gap-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm" style={{marginLeft:`${index*8}%`}}>
                <Clock3 className="size-4 text-[var(--signal)]" /><span className="font-mono text-xs">{task[0]}</span><span className="flex-1 font-bold">{task[1]}</span>
                <Badge tone={task[3]==="alta"?"signal":"neutral"}>{task[2]}</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between"><h2 className="font-extrabold">Hoje</h2><CalendarDays className="size-5 text-[var(--muted)]" /></div>
          <div className="mt-5 space-y-3">
            {tasks.map(task=>(
              <label key={task[1]} className="flex items-start gap-3 rounded-xl border border-[var(--line)] p-3">
                <button className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border border-[var(--line)]"><Check className="size-3 opacity-0" /></button>
                <span><span className="block text-sm font-bold">{task[1]}</span><span className="mt-1 block text-xs text-[var(--muted)]">{task[0]} · {task[2]}</span></span>
              </label>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
