import Header from '../../components/HomePageComponents/Header';
import Hero from '../../components/HomePageComponents/Hero';
import FeatureSection from '../../components/HomePageComponents/FeatureSection';
import Footer from '../../components/Footer/Footer';
import './HomePage.css';

export default function HomePage({ user, setUser }) {

  return (
    <div className="homepage-container">
      <Header />
      <main className="container">
        <Hero setUser={setUser} />
        <FeatureSection />
      </main>
      <Footer user={user} />
    </div>
  );
}