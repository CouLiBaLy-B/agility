import { Zap, ArrowRight, ToggleLeft, ToggleRight, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useCurrentUser } from '../context/AppDataContext';
import { isApiEnabled } from '../api/client';
import {
  createAutomation,
  deleteAutomation,
  listAutomations,
  updateAutomation,
  type AutomationRule,
} from '../api/automations';

interface AutomationRecipe {
  id: string;
  text: string;
  active: boolean;
}

function buildRecipes(currentUserName: string): AutomationRecipe[] {
  return [
    { id: 'local-1', text: 'When status changes to "Done", move to next group', active: true },
    { id: 'local-2', text: 'When deadline is approaching, notify the owner', active: true },
    { id: 'local-3', text: 'Every Monday, create a recurring task for Weekly Sync', active: false },
    { id: 'local-4', text: `When a new task is created, assign ${currentUserName}`, active: false },
  ];
}

function fromRule(rule: AutomationRule): AutomationRecipe {
  return { id: rule.id, text: rule.name, active: rule.active };
}

interface AutomationsProps {
  boardId?: string;
}

export function Automations({ boardId }: AutomationsProps) {
  const currentUser = useCurrentUser();
  const fallbackRecipes = useMemo(() => buildRecipes(currentUser.name), [currentUser.name]);
  const [activeRecipes, setActiveRecipes] = useState<AutomationRecipe[]>(fallbackRecipes);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!boardId || !isApiEnabled()) {
      setActiveRecipes(fallbackRecipes);
      return;
    }

    let cancelled = false;
    async function load() {
      try {
        const rules = await listAutomations(boardId!);
        if (!cancelled) setActiveRecipes(rules.map(fromRule));
      } catch (error) {
        console.warn('Unable to load automations.', error);
        if (!cancelled) setActiveRecipes(fallbackRecipes);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [boardId, fallbackRecipes]);

  const toggle = (id: string) => {
    setActiveRecipes((prev) =>
      prev.map((recipe) => (recipe.id === id ? { ...recipe, active: !recipe.active } : recipe)),
    );

    if (isApiEnabled() && !id.startsWith('local-')) {
      const recipe = activeRecipes.find((item) => item.id === id);
      if (recipe) {
        void updateAutomation(id, { active: !recipe.active }).catch((error) =>
          console.warn('Unable to update automation.', error),
        );
      }
    }
  };

  const addRecipe = () => {
    const text = 'When a new task is created, notify assignees';
    if (!boardId || !isApiEnabled()) {
      setActiveRecipes((prev) => [...prev, { id: `local-${Date.now()}`, text, active: false }]);
      return;
    }

    setIsSaving(true);
    void createAutomation(boardId, {
      name: text,
      active: false,
      trigger: { event: 'task.created' },
      actions: { type: 'notification.send', target: 'assignees' },
    })
      .then((rule) => setActiveRecipes((prev) => [...prev, fromRule(rule)]))
      .catch((error) => console.warn('Unable to create automation.', error))
      .finally(() => setIsSaving(false));
  };

  const removeRecipe = (id: string) => {
    setActiveRecipes((prev) => prev.filter((recipe) => recipe.id !== id));
    if (isApiEnabled() && !id.startsWith('local-')) {
      void deleteAutomation(id).catch((error) => console.warn('Unable to delete automation.', error));
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Zap className="w-5 h-5 text-amber-600 fill-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Automations</h3>
            <p className="text-xs text-gray-500">Boost your workflow with automated recipes</p>
          </div>
        </div>
        <button
          onClick={addRecipe}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 disabled:opacity-60 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Add Recipe
        </button>
      </div>

      <div className="space-y-3">
        {activeRecipes.map((recipe) => (
          <div
            key={recipe.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 group hover:border-amber-200 transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-1.5 bg-white rounded-md border border-gray-200">
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <span className="text-sm font-medium text-gray-700 truncate">{recipe.text}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => removeRecipe(recipe.id)} aria-label="Delete automation">
                <Trash2 className="w-4 h-4 text-gray-300 hover:text-red-500" />
              </button>
              <button onClick={() => toggle(recipe.id)} aria-label="Toggle automation">
                {recipe.active ? (
                  <ToggleRight className="w-8 h-8 text-green-500" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-300" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
