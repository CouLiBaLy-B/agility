export interface User {
  id: string;
  name: string;
  avatar: string;
  initials: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  status: 'done' | 'working' | 'stuck' | 'not_started';
  priority: 'high' | 'medium' | 'low';
  assignees: string[];
  dueDate: string;
  startDate: string;
  tags: string[];
  description: string;
  subtasks: { id: string; title: string; completed: boolean }[];
  comments: { id: string; userId: string; text: string; date: string }[];
}

export interface Board {
  id: string;
  name: string;
  icon: string;
  color: string;
  tasks: Task[];
}

export interface Notification {
  id: string;
  userId: string;
  text: string;
  type: 'mention' | 'status_change' | 'deadline';
  date: string;
  isRead: boolean;
  taskId: string;
}

export const notifications: Notification[] = [
  { id: 'n1', userId: 'u2', text: 'Marcus mentioned you in Design system update', type: 'mention', date: '2026-04-20', isRead: false, taskId: 't2' },
  { id: 'n2', userId: 'u3', text: 'Emily changed status of User research to "Working"', type: 'status_change', date: '2026-04-19', isRead: true, taskId: 't4' },
];

export const users: User[] = [
  { id: 'u1', name: 'Sarah Chen', avatar: '', initials: 'SC', color: '#E2445C' },
  { id: 'u2', name: 'Marcus Johnson', avatar: '', initials: 'MJ', color: '#579BFC' },
  { id: 'u3', name: 'Emily Davis', avatar: '', initials: 'ED', color: '#00C875' },
  { id: 'u4', name: 'Alex Kim', avatar: '', initials: 'AK', color: '#FF642E' },
  { id: 'u5', name: 'Jordan Lee', avatar: '', initials: 'JL', color: '#A25DDC' },
];

export const boards: Board[] = [
  {
    id: 'b1',
    name: 'Product Launch Q2',
    icon: 'rocket',
    color: '#E2445C',
    tasks: [
      {
        id: 't1',
        title: 'Finalize product roadmap',
        status: 'done',
        priority: 'high',
        assignees: ['u1', 'u2'],
        dueDate: '2026-04-15',
        startDate: '2026-03-20',
        tags: ['Planning', 'Strategy'],
        description: 'Review and finalize the product roadmap for Q2 2026, including feature prioritization and resource allocation.',
        subtasks: [
          { id: 's1', title: 'Gather stakeholder input', completed: true },
          { id: 's2', title: 'Draft initial roadmap', completed: true },
          { id: 's3', title: 'Review with leadership', completed: true },
        ],
        comments: [
          { id: 'c1', userId: 'u1', text: 'Great work on this! The roadmap looks solid.', date: '2026-04-14' },
        ],
      },
      {
        id: 't2',
        title: 'Design system update',
        status: 'working',
        priority: 'high',
        assignees: ['u3'],
        dueDate: '2026-05-01',
        startDate: '2026-04-10',
        tags: ['Design', 'UI/UX'],
        description: 'Update the design system with new components and guidelines for the upcoming product release.',
        subtasks: [
          { id: 's4', title: 'Audit existing components', completed: true },
          { id: 's5', title: 'Design new components', completed: false },
          { id: 's6', title: 'Update documentation', completed: false },
        ],
        comments: [],
      },
      {
        id: 't3',
        title: 'Marketing campaign planning',
        status: 'working',
        priority: 'medium',
        assignees: ['u4', 'u5'],
        dueDate: '2026-05-10',
        startDate: '2026-04-15',
        tags: ['Marketing', 'Campaign'],
        description: 'Plan and execute the marketing campaign for the Q2 product launch across all channels.',
        subtasks: [
          { id: 's7', title: 'Define target audience', completed: true },
          { id: 's8', title: 'Create campaign assets', completed: false },
          { id: 's9', title: 'Schedule social media posts', completed: false },
        ],
        comments: [
          { id: 'c2', userId: 'u4', text: 'Should we include influencer partnerships?', date: '2026-04-18' },
        ],
      },
      {
        id: 't4',
        title: 'User research interviews',
        status: 'not_started',
        priority: 'medium',
        assignees: ['u3'],
        dueDate: '2026-05-20',
        startDate: '2026-05-01',
        tags: ['Research', 'UX'],
        description: 'Conduct user research interviews to gather feedback on the current product experience.',
        subtasks: [
          { id: 's10', title: 'Recruit participants', completed: false },
          { id: 's11', title: 'Prepare interview guide', completed: false },
          { id: 's12', title: 'Conduct interviews', completed: false },
        ],
        comments: [],
      },
      {
        id: 't5',
        title: 'Backend API optimization',
        status: 'stuck',
        priority: 'high',
        assignees: ['u2'],
        dueDate: '2026-04-25',
        startDate: '2026-04-05',
        tags: ['Engineering', 'Performance'],
        description: 'Optimize backend APIs to improve response times and reduce server load.',
        subtasks: [
          { id: 's13', title: 'Profile current performance', completed: true },
          { id: 's14', title: 'Implement caching layer', completed: false },
          { id: 's15', title: 'Load testing', completed: false },
        ],
        comments: [
          { id: 'c3', userId: 'u2', text: 'Running into issues with the caching implementation. Need to discuss approach.', date: '2026-04-20' },
        ],
      },
      {
        id: 't6',
        title: 'Competitor analysis',
        status: 'done',
        priority: 'low',
        assignees: ['u5'],
        dueDate: '2026-04-10',
        startDate: '2026-03-25',
        tags: ['Research', 'Strategy'],
        description: 'Analyze competitor products and strategies to identify opportunities and threats.',
        subtasks: [
          { id: 's16', title: 'Identify key competitors', completed: true },
          { id: 's17', title: 'Analyze feature sets', completed: true },
          { id: 's18', title: 'Create comparison matrix', completed: true },
        ],
        comments: [],
      },
      {
        id: 't7',
        title: 'Mobile app beta testing',
        status: 'working',
        priority: 'high',
        assignees: ['u1', 'u4'],
        dueDate: '2026-05-15',
        startDate: '2026-04-20',
        tags: ['Mobile', 'Testing'],
        description: 'Coordinate beta testing program for the mobile app with selected users.',
        subtasks: [
          { id: 's19', title: 'Set up beta program', completed: true },
          { id: 's20', title: 'Distribute beta builds', completed: true },
          { id: 's21', title: 'Collect feedback', completed: false },
        ],
        comments: [],
      },
      {
        id: 't8',
        title: 'Content strategy review',
        status: 'not_started',
        priority: 'low',
        assignees: ['u5'],
        dueDate: '2026-05-25',
        startDate: '2026-05-05',
        tags: ['Content', 'Strategy'],
        description: 'Review and update the content strategy to align with new product positioning.',
        subtasks: [
          { id: 's22', title: 'Audit current content', completed: false },
          { id: 's23', title: 'Define content pillars', completed: false },
          { id: 's24', title: 'Create editorial calendar', completed: false },
        ],
        comments: [],
      },
    ],
  },
  {
    id: 'b2',
    name: 'Engineering Sprint 24',
    icon: 'code',
    color: '#579BFC',
    tasks: [
      {
        id: 't9',
        title: 'Implement OAuth 2.0',
        status: 'working',
        priority: 'high',
        assignees: ['u2'],
        dueDate: '2026-04-30',
        startDate: '2026-04-15',
        tags: ['Security', 'Auth'],
        description: 'Implement OAuth 2.0 authentication flow for third-party integrations.',
        subtasks: [
          { id: 's25', title: 'Research OAuth providers', completed: true },
          { id: 's26', title: 'Implement authorization server', completed: false },
          { id: 's27', title: 'Add client registration', completed: false },
        ],
        comments: [],
      },
      {
        id: 't10',
        title: 'Database migration',
        status: 'not_started',
        priority: 'high',
        assignees: ['u2', 'u4'],
        dueDate: '2026-05-05',
        startDate: '2026-04-25',
        tags: ['Database', 'Migration'],
        description: 'Migrate production database to new schema with zero downtime.',
        subtasks: [
          { id: 's28', title: 'Create migration scripts', completed: false },
          { id: 's29', title: 'Test in staging', completed: false },
          { id: 's30', title: 'Execute production migration', completed: false },
        ],
        comments: [],
      },
      {
        id: 't11',
        title: 'CI/CD pipeline improvements',
        status: 'done',
        priority: 'medium',
        assignees: ['u4'],
        dueDate: '2026-04-20',
        startDate: '2026-04-05',
        tags: ['DevOps', 'CI/CD'],
        description: 'Improve CI/CD pipeline with faster builds and better test coverage.',
        subtasks: [
          { id: 's31', title: 'Optimize build times', completed: true },
          { id: 's32', title: 'Add parallel test execution', completed: true },
          { id: 's33', title: 'Implement deployment gates', completed: true },
        ],
        comments: [],
      },
    ],
  },
  {
    id: 'b3',
    name: 'Design Sprint',
    icon: 'palette',
    color: '#A25DDC',
    tasks: [
      {
        id: 't12',
        title: 'Wireframe new dashboard',
        status: 'working',
        priority: 'medium',
        assignees: ['u3'],
        dueDate: '2026-04-28',
        startDate: '2026-04-15',
        tags: ['Design', 'Wireframes'],
        description: 'Create wireframes for the new analytics dashboard.',
        subtasks: [
          { id: 's34', title: 'Sketch initial concepts', completed: true },
          { id: 's35', title: 'Create low-fidelity wireframes', completed: true },
          { id: 's36', title: 'Get stakeholder feedback', completed: false },
        ],
        comments: [],
      },
      {
        id: 't13',
        title: 'Icon library refresh',
        status: 'not_started',
        priority: 'low',
        assignees: ['u3'],
        dueDate: '2026-05-10',
        startDate: '2026-04-25',
        tags: ['Design', 'Icons'],
        description: 'Refresh the icon library with new consistent icon designs.',
        subtasks: [
          { id: 's37', title: 'Audit current icons', completed: false },
          { id: 's38', title: 'Design new icon set', completed: false },
          { id: 's39', title: 'Export and document', completed: false },
        ],
        comments: [],
      },
    ],
  },
];

export const statusConfig = {
  done: { label: 'Done', color: '#00C875', bg: 'rgba(0, 200, 117, 0.15)' },
  working: { label: 'Working on it', color: '#579BFC', bg: 'rgba(87, 155, 252, 0.15)' },
  stuck: { label: 'Stuck', color: '#E2445C', bg: 'rgba(226, 68, 92, 0.15)' },
  not_started: { label: 'Not Started', color: '#C4C4C4', bg: 'rgba(196, 196, 196, 0.15)' },
};

export const priorityConfig = {
  high: { label: 'High', color: '#E2445C' },
  medium: { label: 'Medium', color: '#FF642E' },
  low: { label: 'Low', color: '#579BFC' },
};
