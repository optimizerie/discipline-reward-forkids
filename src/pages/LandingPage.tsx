import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GeminiIcon } from '@/components/GeminiIcon';
import { ICON_KEYS } from '@/lib/gemini';
import { navigate } from '../App';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-orange-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-border sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <GeminiIcon iconKey={ICON_KEYS.APP_LOGO} size={36} />
          <span className="text-2xl font-black text-primary">KidQuest</span>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/parent/auth')}>Parent Login</Button>
          <Button size="sm" onClick={() => navigate('/child')}>Child Access</Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 py-20 max-w-3xl mx-auto">
        <Badge variant="default" className="mb-6 text-sm px-4 py-1">Daily Quests for Kids</Badge>
        <div className="w-32 h-32 mb-8">
          <GeminiIcon iconKey={ICON_KEYS.APP_LOGO} size={128} className="w-32 h-32" />
        </div>
        <h1 className="text-5xl font-black text-foreground mb-4 leading-tight">
          Every Day is a<br /><span className="text-primary">New Adventure</span>
        </h1>
        <p className="text-lg text-muted-foreground font-semibold mb-10 max-w-xl">
          KidQuest helps children build great habits through daily activities, points, and streaks. Parents track progress, kids celebrate wins.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <Button size="xl" className="flex-1 gap-3" onClick={() => navigate('/child')}>
            <GeminiIcon iconKey={ICON_KEYS.CHILD_ACCESS} size={24} className="rounded-md" />
            Child Access
          </Button>
          <Button size="xl" variant="outline" className="flex-1 gap-3" onClick={() => navigate('/parent/auth')}>
            <GeminiIcon iconKey={ICON_KEYS.PARENT_DASHBOARD} size={24} className="rounded-md" />
            Parent Login
          </Button>
        </div>
      </section>

      {/* Categories */}
      <section className="px-6 pb-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-black text-center mb-8 text-foreground">Three Quest Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { key: ICON_KEYS.CHORES, title: 'Daily Chores', desc: 'Brush teeth, tidy room, make bed, and more', color: 'from-green-400 to-emerald-500' },
            { key: ICON_KEYS.MATH, title: 'Math & Learning', desc: 'Practice problems, homework, and reading', color: 'from-blue-400 to-indigo-500' },
            { key: ICON_KEYS.SQUASH, title: 'Squash Training', desc: 'Ghosting, drills, and court writing', color: 'from-orange-400 to-red-500' },
          ].map(cat => (
            <Card key={cat.key} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className={`h-3 bg-gradient-to-r ${cat.color}`} />
              <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
                <GeminiIcon iconKey={cat.key} size={72} className="rounded-2xl shadow-sm" />
                <div>
                  <h3 className="font-extrabold text-lg">{cat.title}</h3>
                  <p className="text-sm text-muted-foreground font-semibold mt-1">{cat.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 pb-20 max-w-3xl mx-auto">
        <h2 className="text-2xl font-black text-center mb-10 text-foreground">How KidQuest Works</h2>
        <div className="space-y-6">
          {[
            { num: 1, title: 'Parent sets up quests', desc: 'Create a child profile and choose which daily activities they should complete', icon: ICON_KEYS.PARENT_DASHBOARD },
            { num: 2, title: 'Child logs in & completes tasks', desc: 'Kids tap their name, enter their PIN, and check off tasks as they finish them', icon: ICON_KEYS.CHILD_ACCESS },
            { num: 3, title: 'Earn points & streaks', desc: 'Every completed task earns points. Consistency builds streaks and bonus rewards', icon: ICON_KEYS.TROPHY },
          ].map(step => (
            <div key={step.num} className="flex items-start gap-5">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-lg flex-shrink-0">
                {step.num}
              </div>
              <div className="flex-1 pt-1">
                <h3 className="font-extrabold text-base">{step.title}</h3>
                <p className="text-sm text-muted-foreground font-semibold mt-1">{step.desc}</p>
              </div>
              <GeminiIcon iconKey={step.icon} size={48} className="rounded-xl flex-shrink-0" />
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-border px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <GeminiIcon iconKey={ICON_KEYS.APP_LOGO} size={24} />
          <span className="font-black text-primary">KidQuest</span>
        </div>
        <p className="text-sm text-muted-foreground font-semibold">Building great habits, one quest at a time.</p>
      </footer>
    </div>
  );
}
