import { useEffect, useState } from 'react';
import { navigate } from '../App';
import { generateEncouragingImage } from '../lib/gemini';

export function LandingPage() {
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    setImageLoading(true);
    generateEncouragingImage(
      'a young champion',
      'Celebrating kids completing their daily chores, homework, and sports practice. Show a happy child with stars and trophies around them'
    ).then(img => {
      setHeroImage(img);
      setImageLoading(false);
    });
  }, []);

  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <span className="landing-logo-icon">🌟</span>
          KidQuest
        </div>
        <div className="landing-nav-actions">
          <button className="btn-ghost btn-sm" onClick={() => navigate('/parent/auth')}>
            Parent Login
          </button>
          <button className="btn-primary btn-sm" onClick={() => navigate('/child')}>
            Child Access
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">🏆 Daily Challenges Await</div>
          <h1 className="hero-title">KidQuest</h1>
          <p className="hero-sub">
            Every day is a new adventure! Complete your chores, crush your homework,
            and practice your sport to earn points and rewards!
          </p>
          <div className="hero-actions">
            <button className="btn-hero-parent" onClick={() => navigate('/parent/auth')}>
              🔑 Parent Login
            </button>
            <button className="btn-hero-child" onClick={() => navigate('/child')}>
              🚀 I'm a Kid!
            </button>
          </div>

          <div className="hero-image-area">
            {imageLoading ? (
              <div className="hero-image-placeholder">🌟</div>
            ) : heroImage ? (
              <img src={heroImage} alt="KidQuest hero" className="hero-generated-image" />
            ) : (
              <div className="hero-image-placeholder">🏆</div>
            )}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="categories-section">
        <h2 className="section-title">Your Daily Quests</h2>
        <p className="section-sub">Complete activities in three epic categories to earn points!</p>
        <div className="categories-grid">
          <div className="category-preview-card" style={{ borderTop: '4px solid #00b894' }}>
            <span className="category-preview-icon">🏠</span>
            <div className="category-preview-name">Chores</div>
            <div className="category-preview-desc">
              Keep your space tidy! Brush teeth, make your bed, take out trash and more.
            </div>
            <div style={{ marginTop: 12 }}>
              {['Brush Teeth', 'Make Bed', 'Tidy Room'].map(a => (
                <span key={a} className="badge badge-green" style={{ margin: '2px' }}>{a}</span>
              ))}
            </div>
          </div>

          <div className="category-preview-card" style={{ borderTop: '4px solid #0984e3' }}>
            <span className="category-preview-icon">📚</span>
            <div className="category-preview-name">Math & Learning</div>
            <div className="category-preview-desc">
              Exercise your brain! Practice problems, homework, and reading challenges.
            </div>
            <div style={{ marginTop: 12 }}>
              {['Homework', 'Reading', 'Practice'].map(a => (
                <span key={a} className="badge badge-blue" style={{ margin: '2px' }}>{a}</span>
              ))}
            </div>
          </div>

          <div className="category-preview-card" style={{ borderTop: '4px solid #e17055' }}>
            <span className="category-preview-icon">🎾</span>
            <div className="category-preview-name">Squash</div>
            <div className="category-preview-desc">
              Train like a champion! Ghosting, drills, and skill-building on the court.
            </div>
            <div style={{ marginTop: 12 }}>
              {['Ghosting', 'Drill 1', 'Drill 2'].map(a => (
                <span key={a} className="badge badge-orange" style={{ margin: '2px' }}>{a}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '60px 48px', background: '#fff' }}>
        <h2 className="section-title">How KidQuest Works</h2>
        <p className="section-sub">Three simple steps to become a champion!</p>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { num: '1', icon: '👨‍👩‍👧', title: 'Parent Sets Up', desc: 'Create your child\'s profile and choose which activities they should complete each day.' },
            { num: '2', icon: '✅', title: 'Kids Complete Tasks', desc: 'Kids log in with their PIN and check off activities as they complete them throughout the day.' },
            { num: '3', icon: '🏆', title: 'Earn Points & Streaks', desc: 'Every completed activity earns points. Keep up your daily streak for bonus celebrations!' },
          ].map(step => (
            <div key={step.num} style={{
              display: 'flex', gap: 24, padding: '24px 0',
              borderBottom: step.num !== '3' ? '1px solid #ece9f8' : 'none'
            }}>
              <div style={{ fontSize: 36, minWidth: 56, textAlign: 'center' }}>{step.icon}</div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 17, marginBottom: 4 }}>
                  Step {step.num}: {step.title}
                </div>
                <div style={{ color: 'var(--gray-600)', fontSize: 15, fontWeight: 600 }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div>🌟 KidQuest — Making every day an adventure</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <button className="btn-ghost btn-sm" style={{ color: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.3)' }} onClick={() => navigate('/parent/auth')}>
            Parent Login
          </button>
          <button className="btn-primary btn-sm" onClick={() => navigate('/child')}>
            Child Access
          </button>
        </div>
      </footer>
    </div>
  );
}
