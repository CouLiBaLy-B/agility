import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Palette, Database, Share2, LogOut, Save } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { isApiEnabled } from '../api/client';
import { getPreferences, updatePreferences, type UserPreferences } from '../api/preferences';
import { updateMe } from '../api/users';
import { createTag, deleteTag, listTags, updateTag, type Tag } from '../api/tags';

export function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const { currentUser, setCurrentUser, workspace } = useAppData();
  const [initialFirstName = currentUser.name, initialLastName = ''] = currentUser.name.split(' ');
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [email, setEmail] = useState(currentUser.email ?? '');
  const [preferences, setPreferences] = useState<UserPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    theme: 'system',
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#579BFC');

  useEffect(() => {
    const [nextFirstName = currentUser.name, nextLastName = ''] = currentUser.name.split(' ');
    setFirstName(nextFirstName);
    setLastName(nextLastName);
    setEmail(currentUser.email ?? '');
  }, [currentUser]);

  useEffect(() => {
    if (!isApiEnabled()) return;
    void getPreferences()
      .then(setPreferences)
      .catch((error) => console.warn('Unable to load preferences.', error));
  }, []);

  useEffect(() => {
    if (!workspace) return;
    if (!isApiEnabled()) {
      setTags([]);
      return;
    }
    void listTags(workspace.id)
      .then(setTags)
      .catch((error) => console.warn('Unable to load tags.', error));
  }, [workspace]);

  const persistPreferences = (next: UserPreferences) => {
    setPreferences(next);
    setSaveStatus('idle');
    if (!isApiEnabled()) return;
    void updatePreferences(next)
      .then((saved) => {
        setPreferences(saved);
        setSaveStatus('saved');
      })
      .catch((error) => {
        console.warn('Unable to save preferences.', error);
        setSaveStatus('error');
      });
  };

  const saveTag = (tag: Tag, input: Partial<Pick<Tag, 'name' | 'color'>>) => {
    setTags((current) => current.map((item) => (item.id === tag.id ? { ...item, ...input } : item)));
    if (isApiEnabled()) {
      void updateTag(tag.id, input).catch((error) => console.warn('Unable to update tag.', error));
    }
  };

  const addTag = () => {
    const name = newTagName.trim();
    if (!name || !workspace) return;
    if (!isApiEnabled()) {
      setTags((current) => [
        ...current,
        { id: crypto.randomUUID(), workspaceId: workspace.id, name, color: newTagColor },
      ]);
      setNewTagName('');
      return;
    }
    void createTag({ name, color: newTagColor }, workspace.id)
      .then((tag) => {
        setTags((current) => (current.some((item) => item.id === tag.id) ? current : [...current, tag]));
        setNewTagName('');
      })
      .catch((error) => console.warn('Unable to create tag.', error));
  };

  const removeTag = (tagId: string) => {
    setTags((current) => current.filter((tag) => tag.id !== tagId));
    if (isApiEnabled()) {
      void deleteTag(tagId).catch((error) => console.warn('Unable to delete tag.', error));
    }
  };

  const saveProfile = () => {
    const name = `${firstName} ${lastName}`.trim();
    setSaveStatus('idle');
    if (!isApiEnabled()) {
      setCurrentUser?.((user) => ({ ...user, name, email }));
      setSaveStatus('saved');
      return;
    }

    void updateMe({ name, email })
      .then((savedUser) => {
        setCurrentUser?.(savedUser);
        setSaveStatus('saved');
      })
      .catch((error) => {
        console.warn('Unable to save profile.', error);
        setSaveStatus('error');
      });
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'integrations', label: 'Integrations', icon: Database },
    { id: 'sharing', label: 'Sharing', icon: Share2 },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex">
        <div className="w-64 border-r border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">Settings</h2>
            <p className="text-xs text-gray-400 mt-1">Customize your workspace</p>
          </div>
          <nav className="p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors mt-4">
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </nav>
        </div>

        <div className="flex-1 p-6">          <motion.h3
            key={activeTab}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg font-bold text-gray-800 mb-6"
          >
            {tabs.find((t) => t.id === activeTab)?.label || 'Settings'}
          </motion.h3>
          {saveStatus === 'saved' && (
            <p className="-mt-4 mb-4 text-xs font-medium text-green-600">Preferences saved.</p>
          )}
          {saveStatus === 'error' && (
            <p className="-mt-4 mb-4 text-xs font-medium text-red-600">Unable to save preferences.</p>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="flex items-center gap-6">
                <div
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold"
                  style={{ backgroundColor: '#579BFC' }}
                >
                  {currentUser.initials}
                </div>
                <div>
                  <button className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors">
                    Change Photo
                  </button>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
              </div>

              <button
                onClick={saveProfile}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">Email Notifications</p>
                  <p className="text-sm text-gray-400">Receive updates via email</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={(event) =>
                    persistPreferences({ ...preferences, emailNotifications: event.target.checked })
                  }
                  className="w-10 h-5 rounded-full toggle"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">Push Notifications</p>
                  <p className="text-sm text-gray-400">Receive mobile push alerts</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.pushNotifications}
                  onChange={(event) =>
                    persistPreferences({ ...preferences, pushNotifications: event.target.checked })
                  }
                  className="w-10 h-5 rounded-full toggle"
                />
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <div>
                <p className="font-medium text-gray-700 mb-3">Theme</p>
                <div className="flex gap-3">
                  {(['light', 'dark', 'system'] as const).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => persistPreferences({ ...preferences, theme })}
                      className={`flex-1 p-3 border rounded-lg text-sm capitalize hover:bg-gray-50 transition-colors ${
                        preferences.theme === theme ? 'border-blue-500 bg-blue-50 text-blue-600 font-medium' : ''
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-700 mb-3">Accent Color</p>
                <div className="flex gap-2">
                  {['#579BFC', '#00C875', '#E2445C', '#FF642E', '#A25DDC'].map((color) => (
                    <button
                      key={color}
                      className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800">Workspace tags</h4>
                <p className="text-sm text-gray-400">Create and maintain reusable task tags.</p>
              </div>
              <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                <input
                  value={newTagName}
                  onChange={(event) => setNewTagName(event.target.value)}
                  placeholder="Tag name"
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(event) => setNewTagColor(event.target.value)}
                  className="w-12 h-10 border border-gray-200 rounded-lg"
                />
                <button
                  onClick={addTag}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600"
                >
                  Add tag
                </button>
              </div>
              <div className="space-y-2">
                {tags.length === 0 && (
                  <p className="text-sm text-gray-400">No tags loaded yet. API mode will load workspace tags.</p>
                )}
                {tags.map((tag) => (
                  <div key={tag.id} className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-100 rounded-lg">
                    <input
                      value={tag.name}
                      onChange={(event) => saveTag(tag, { name: event.target.value })}
                      className="flex-1 bg-white px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                    <input
                      type="color"
                      value={tag.color}
                      onChange={(event) => saveTag(tag, { color: event.target.value })}
                      className="w-10 h-10 border border-gray-200 rounded-lg"
                    />
                    <button
                      onClick={() => removeTag(tag.id)}
                      className="px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}