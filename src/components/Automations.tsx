import { Zap, ArrowRight, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';
import { useState } from 'react';

const recipes = [
  { id: 1, text: 'When status changes to "Done", move to next group', active: true },
  { id: 2, text: 'When deadline is approaching, notify the owner', active: true },
  { id: 3, text: 'Every Monday, create a recurring task for Weekly Sync', active: false },
  { id: 4, text: 'When a new task is created, assign Sarah Chen', active: false },
];

export function Automations() {
  const [activeRecipes, setActiveRecipes] = useState(recipes);

  const toggle = (id: number) => {
    setActiveRecipes(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
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
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-all">
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
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white rounded-md border border-gray-200">
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <span className="text-sm font-medium text-gray-700">{recipe.text}</span>
            </div>
            <button onClick={() => toggle(recipe.id)}>
              {recipe.active ? (
                <ToggleRight className="w-8 h-8 text-green-500" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-gray-300" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
