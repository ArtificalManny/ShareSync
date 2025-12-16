// src/components/project/CollaborationPanel.jsx - PHASE 3 WITH LIVE TAB ENHANCEMENT
import React, { useState } from 'react';
import ChatTab from './chat/ChatTab';
import useFocusStatus from '../../hooks/useFocusStatus';

const TABS = [
  { id: 'live', label: 'Live', icon: '🔴' },
  { id: 'chat', label: 'Chat', icon: '��' },
];

export default function CollaborationPanel({ projectId, projectName, defaultTab = 'live' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { focusedMembers, loading: focusLoading } = useFocusStatus(projectId);

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
      {/* Tab navigation */}
      <div className="flex items-center border-b border-slate-700 bg-slate-900/50">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 px-4 py-3 text-sm font-medium transition-colors relative
                ${isActive
                  ? 'text-white bg-slate-800/50'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
                }
              `}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
              
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"></div>
              )}

              {tab.id === 'live' && focusedMembers.length > 0 && !isActive && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
                  {focusedMembers.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'live' && (
          <div className="h-full overflow-y-auto">
            {focusLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm text-slate-400">Loading team status...</p>
                </div>
              </div>
            ) : focusedMembers.length > 0 ? (
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    In Focus Mode ({focusedMembers.length})
                  </h3>
                  <div className="space-y-3">
                    {focusedMembers.map((member, i) => (
                      <div 
                        key={i} 
                        className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                      >
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden">
                            {member.avatar ? (
                              <img 
                                src={member.avatar} 
                                alt={member.name} 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white font-semibold">
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 border-2 border-slate-900 rounded-full animate-pulse" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm">{member.name}</p>
                          <p className="text-slate-400 text-xs truncate">{member.activity}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-orange-400 font-medium">
                              �� {member.remainingMinutes} min left
                            </span>
                          </div>
                        </div>

                        {member.sessionType && (
                          <div className="flex-shrink-0">
                            <span className="text-xs px-2 py-1 rounded-md bg-slate-700/50 text-slate-300 capitalize">
                              {member.sessionType === 'pomodoro' ? '🍅' : '🧠'}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <p className="text-xs text-orange-300 leading-relaxed">
                    💡 <strong>Focus Mode Active:</strong> Messages to these teammates will respect their deep work time. 
                    Notifications will be delayed until their break.
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-6">
                <div className="text-center max-w-sm">
                  <div className="text-5xl mb-4">💤</div>
                  <h3 className="text-lg font-semibold text-white mb-2">No one in focus mode</h3>
                  <p className="text-sm text-slate-400 mb-6">
                    Start a focus session to let your team know you're doing deep work
                  </p>
                  <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors">
                    Start Focus Session
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <ChatTab projectId={projectId} projectName={projectName} />
        )}
      </div>
    </div>
  );
}
