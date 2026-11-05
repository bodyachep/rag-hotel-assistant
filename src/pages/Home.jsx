import { motion } from "framer-motion";
import { Building2, Search, CalendarCheck, Activity, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const stats = [
    { title: "Готелів у базі", value: "140", icon: <Building2 size={24} />, color: "blue" },
    { title: "AI Пошуків", value: "1,284", icon: <Search size={24} />, color: "purple" },
    { title: "Бронювань", value: "342", icon: <CalendarCheck size={24} />, color: "green" },
    { title: "Статус RAG", value: "Online", icon: <Activity size={24} />, color: "orange" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="dashboard-layout">
      <div className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              Огляд системи
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              Керування пошуком та бронюванням готелів через RAG AI.
            </motion.p>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Link to="/assistant" className="action-button">
              Відкрити AI Assistant <ArrowRight size={18} />
            </Link>
          </motion.div>
        </header>

        <motion.div 
          className="stats-grid"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {stats.map((stat, index) => (
            <motion.div key={index} className="stat-card" variants={itemVariants}>
              <div className={`stat-icon-wrapper ${stat.color}`}>
                {stat.icon}
              </div>
              <div className="stat-info">
                <h3>{stat.value}</h3>
                <p>{stat.title}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.section 
          className="recent-activity"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2>Останні AI-запити</h2>
          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-time">10 хв тому</span>
              <p>"Знайди готель в Одесі з укриттям до 3000 грн"</p>
              <span className="activity-status success">Оброблено</span>
            </div>
            <div className="activity-item">
              <span className="activity-time">45 хв тому</span>
              <p>"Готелі у Львові з паркінгом та генератором"</p>
              <span className="activity-status success">Оброблено</span>
            </div>
            <div className="activity-item">
              <span className="activity-time">2 год тому</span>
              <p>"Покажи варіанти на першому поверсі, без акумулятора"</p>
              <span className="activity-status success">Оброблено</span>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}