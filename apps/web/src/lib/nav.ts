import {
  Bell, Bot, BriefcaseBusiness, Building2, CalendarDays, ChartNoAxesCombined,
  CircleDollarSign, ClipboardCheck, ContactRound, FileCheck2, FileText,
  FolderOpen, Headphones, House, Landmark, LayoutDashboard, ListTodo,
  MessageSquareText, Package, PanelsTopLeft, ReceiptText, Search,
  Settings2, ShieldCheck, Sparkles, Target, UsersRound, WalletCards, Lock
} from "lucide-react";

export const navigation = [
  { title: "Início", items: [{ label: "Central de hoje", href: "/app/hoje", icon: House }] },
  { title: "Comercial", items: [
    { label: "Leads", href: "/app/comercial/leads", icon: UsersRound },
    { label: "Prospecção", href: "/app/comercial/prospeccao", icon: Target },
    { label: "Contatos e empresas", href: "/app/comercial/contatos", icon: ContactRound },
    { label: "Oportunidades", href: "/app/comercial/oportunidades", icon: ChartNoAxesCombined },
    { label: "Briefings", href: "/app/comercial/briefings", icon: ClipboardCheck },
    { label: "Propostas", href: "/app/comercial/propostas", icon: FileText },
    { label: "Produtos e serviços", href: "/app/comercial/produtos", icon: Package }
  ]},
  { title: "Operação", items: [
    { label: "Projetos", href: "/app/operacao/projetos", icon: BriefcaseBusiness },
    { label: "Tarefas e calendário", href: "/app/operacao/tarefas", icon: CalendarDays },
    { label: "Aprovações", href: "/app/operacao/aprovacoes", icon: FileCheck2 },
    { label: "Arquivos", href: "/app/operacao/arquivos", icon: FolderOpen },
    { label: "Controle de horas", href: "/app/operacao/horas", icon: ListTodo },
    { label: "Suporte", href: "/app/operacao/suporte", icon: Headphones }
  ]},
  { title: "Financeiro", items: [
    { label: "Visão financeira", href: "/app/financeiro/visao", icon: CircleDollarSign },
    { label: "Contas a receber", href: "/app/financeiro/receber", icon: ReceiptText },
    { label: "Contas a pagar", href: "/app/financeiro/pagar", icon: WalletCards },
    { label: "Contratos recorrentes", href: "/app/financeiro/recorrentes", icon: Landmark },
    { label: "Finanças pessoais", href: "/app/financeiro/pessoal", icon: ShieldCheck }
  ]},
  { title: "Relacionamento", items: [
    { label: "Portal dos clientes", href: "/app/relacionamento/portal", icon: PanelsTopLeft },
    { label: "Mensagens", href: "/app/relacionamento/mensagens", icon: MessageSquareText },
    { label: "Formulários públicos", href: "/app/relacionamento/formularios", icon: Building2 }
  ]},
  { title: "Inteligência", items: [
    { label: "Relatórios", href: "/app/inteligencia/relatorios", icon: LayoutDashboard },
    { label: "Assistente de IA", href: "/app/inteligencia/assistente", icon: Bot },
    { label: "Notificações", href: "/app/inteligencia/notificacoes", icon: Bell }
  ]},
  { title: "Configurações", items: [
    { label: "Integrações", href: "/app/configuracoes/integracoes", icon: Sparkles },
    { label: "Configurações gerais", href: "/app/configuracoes/geral", icon: Settings2 },
    { label: "Segurança", href: "/app/configuracoes/seguranca", icon: Lock }
  ]}
];

export const mobileNavigation = [
  navigation[0].items[0],
  navigation[1].items[3],
  navigation[2].items[0],
  navigation[3].items[0],
  { label: "Buscar", href: "/app/busca", icon: Search }
];
