document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;

  themeToggle.addEventListener('click', () => {
    body.classList.toggle('light-theme');
  });

  const cards = document.querySelectorAll('.card');
  const revealOnScroll = () => {
    const triggerBottom = window.innerHeight * 0.85;
    cards.forEach(card => {
      const cardTop = card.getBoundingClientRect().top;
      if (cardTop < triggerBottom) {
        card.classList.add('visible');
      }
    });
  };
  window.addEventListener('scroll', revealOnScroll);
  revealOnScroll();

  const enterBtn = document.getElementById('enter-button');
  enterBtn.addEventListener('click', () => {
    document.getElementById('portal').scrollIntoView({ behavior: 'smooth' });
  });

  const activatePortal = document.getElementById('activate-portal');
  activatePortal.addEventListener('click', () => {
    const effect = document.getElementById('portal-effect');
    effect.classList.add('active');
    setTimeout(() => {
      alert('Você atravessou o portal... cuidado com o que encontrará.');
    }, 1500);
  });

  const form = document.getElementById('form-inscricao');
  const msgStatus = document.getElementById('msg-status');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = form.nome.value;
    const email = form.email.value;
    msgStatus.textContent = `Obrigado, ${nome}. Inscrição recebida!`;
    form.reset();
  });
});
