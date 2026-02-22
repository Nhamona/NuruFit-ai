
import { Exercise } from '../types';

export const EXERCISE_DATABASE: Exercise[] = [
  // --- CHEST (PEITO) ---
  {
    id: 'gym_bench_press',
    name: 'Supino Reto',
    description: 'Exercício fundamental para volume de peitoral.',
    difficulty: 'Médio',
    instructions: ['Deite no banco', 'Segure a barra na linha dos ombros', 'Desça até tocar o peito', 'Empurre explosivamente'],
    imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=4Y2ZdHCOXok', // Bench Press Tutorial
    equipment: 'Barbell'
  },
  {
    id: 'gym_incline_press',
    name: 'Supino Inclinado (Halteres)',
    description: 'Foco na parte superior do peito.',
    difficulty: 'Médio',
    instructions: ['Banco a 30-45 graus', 'Desça os halteres até a linha do ombro', 'Empurre para cima fechando no topo'],
    imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=0G2_kRH3x2U',
    equipment: 'Dumbbell'
  },
  {
    id: 'home_pushup_wide',
    name: 'Flexão Aberta',
    description: 'Foco no peitoral maior.',
    difficulty: 'Médio',
    instructions: ['Mãos mais afastadas que os ombros', 'Desça o peito até o chão', 'Mantenha o core firme'],
    imageUrl: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
    equipment: 'None'
  },

  // --- BACK (COSTAS) ---
  {
    id: 'gym_deadlift',
    name: 'Levantamento Terra',
    description: 'Construtor de força total e densidade de costas.',
    difficulty: 'Difícil',
    instructions: ['Pés na largura do quadril', 'Coluna neutra', 'Levante a barra estendendo o quadril'],
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=op9kVnSso6Q',
    equipment: 'Barbell'
  },
  {
    id: 'gym_lat_pulldown',
    name: 'Puxada Alta',
    description: 'Alargamento das costas (Dorsais).',
    difficulty: 'Fácil',
    instructions: ['Puxe a barra até o peito', 'Cotovelos para baixo', 'Controle a subida'],
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=CAwf7n6Luuc',
    equipment: 'Cable'
  },
  {
    id: 'gym_dumbbell_row',
    name: 'Remada Unilateral',
    description: 'Isolamento de dorsais e correção de assimetria.',
    difficulty: 'Médio',
    instructions: ['Apoie joelho e mão no banco', 'Costas retas', 'Puxe o halter em direção ao quadril'],
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=pYcpY20QaE8',
    equipment: 'Dumbbell'
  },
  {
    id: 'home_superman',
    name: 'Superman',
    description: 'Fortalecimento da lombar.',
    difficulty: 'Fácil',
    instructions: ['Deitado de bruços', 'Eleve braços e pernas simultaneamente', 'Segure por 2 segundos'],
    imageUrl: 'https://images.unsplash.com/photo-1544367563-12123d8965cd?w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=z6PJMT2y8GQ',
    equipment: 'None'
  },

  // --- LEGS (PERNAS) ---
  {
    id: 'gym_barbell_squat',
    name: 'Agachamento com Barra',
    description: 'O rei dos exercícios de perna.',
    difficulty: 'Difícil',
    instructions: ['Pés na largura dos ombros', 'Barra no trapézio', 'Agache até quebrar a paralela'],
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=SW_C1A-rejs',
    equipment: 'Barbell'
  },
  {
    id: 'gym_leg_press',
    name: 'Leg Press 45',
    description: 'Foco em quadríceps com segurança.',
    difficulty: 'Médio',
    instructions: ['Pés na plataforma', 'Desça até 90 graus', 'Não trave os joelhos na subida'],
    imageUrl: 'https://images.unsplash.com/photo-1574680096141-1cddd32e04ca?w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ',
    equipment: 'Machine'
  },
  {
    id: 'home_squat',
    name: 'Agachamento Livre',
    description: 'Fundamental para pernas em casa.',
    difficulty: 'Médio',
    instructions: ['Pés na largura dos ombros', 'Agache como se fosse sentar', 'Mantenha o peito estufado'],
    imageUrl: 'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=xqvCmoLULNY',
    equipment: 'None'
  },
  {
    id: 'home_lunge',
    name: 'Afundo (Passada)',
    description: 'Unilateral para glúteos e quadríceps.',
    difficulty: 'Médio',
    instructions: ['Dê um passo à frente', 'Desça o joelho de trás até quase tocar o chão', 'Volte à posição inicial'],
    imageUrl: 'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U',
    equipment: 'None'
  },
  {
    id: 'home_glute_bridge',
    name: 'Elevação Pélvica',
    description: 'Foco total em glúteos.',
    difficulty: 'Fácil',
    instructions: ['Deitado de costas', 'Pés no chão', 'Eleve o quadril contraindo os glúteos'],
    imageUrl: 'https://images.unsplash.com/photo-1574680096141-1cddd32e04ca?w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=wPM8icPu6T8',
    equipment: 'None'
  },

  // --- SHOULDERS (OMBROS) ---
  {
    id: 'gym_shoulder_press',
    name: 'Desenvolvimento c/ Halteres',
    description: 'Volume para deltoides.',
    difficulty: 'Médio',
    instructions: ['Sentado', 'Cotovelos a 90 graus', 'Empurre acima da cabeça'],
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=qEwKCR5JCog',
    equipment: 'Dumbbell'
  },
  {
    id: 'gym_lateral_raise',
    name: 'Elevação Lateral',
    description: 'Largura de ombros (deltoide medial).',
    difficulty: 'Médio',
    instructions: ['De pé', 'Eleve os braços lateralmente até a altura do ombro', 'Controle a descida'],
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
    equipment: 'Dumbbell'
  },
  {
    id: 'home_pike_pushup',
    name: 'Flexão Pike',
    description: 'O melhor exercício de ombro com peso do corpo.',
    difficulty: 'Difícil',
    instructions: ['Posição de V invertido', 'Desça a testa em direção ao chão', 'Empurre de volta'],
    imageUrl: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=sposDXWEB0A',
    equipment: 'None'
  },

  // --- ARMS (BRAÇOS) ---
  {
    id: 'gym_tricep_pushdown',
    name: 'Tríceps Polia',
    description: 'Isolamento de tríceps.',
    difficulty: 'Fácil',
    instructions: ['Cotovelos colados ao corpo', 'Estenda o braço para baixo', 'Aperte o tríceps no final'],
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=2-LAMcpzODU',
    equipment: 'Cable'
  },
  {
    id: 'gym_bicep_curl',
    name: 'Rosca Direta (Barra)',
    description: 'Massa bruta para bíceps.',
    difficulty: 'Fácil',
    instructions: ['De pé', 'Cotovelos parados', 'Flexione os braços'],
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=kwG2ipFRgfo',
    equipment: 'Barbell'
  },
  {
    id: 'home_dips',
    name: 'Mergulho no Banco',
    description: 'Tríceps em casa.',
    difficulty: 'Médio',
    instructions: ['Mãos num banco ou cadeira firme', 'Pés à frente', 'Desça o quadril rente ao banco'],
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=0326dy_-CzM',
    equipment: 'Chair'
  },

  // --- CARDIO & CORE ---
  {
    id: 'cardio_jumping_jacks',
    name: 'Polichinelos',
    description: 'Aquecimento e cardio.',
    difficulty: 'Fácil',
    instructions: ['Salte abrindo pernas e braços', 'Mantenha ritmo constante'],
    imageUrl: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=iSSAk4XCsRA',
    equipment: 'None',
    durationSeconds: 45
  },
  {
    id: 'cardio_burpee',
    name: 'Burpees',
    description: 'Queima de gordura intensa.',
    difficulty: 'Difícil',
    instructions: ['Agache', 'Vá para prancha', 'Faça flexão (opcional)', 'Salte na subida'],
    imageUrl: 'https://images.unsplash.com/photo-1434596922112-19c563067271?w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=auBLPXO8Fww',
    equipment: 'None',
    reps: 12
  },
  {
    id: 'abs_plank',
    name: 'Prancha',
    description: 'Estabilidade do Core.',
    difficulty: 'Médio',
    instructions: ['Antebraços no chão', 'Corpo reto como uma tábua', 'Contraia abdômen e glúteos'],
    imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=ASdvN_XEl_c',
    equipment: 'None',
    durationSeconds: 60
  },
  {
    id: 'abs_crunch',
    name: 'Abdominal Supra',
    description: 'Foco na parte superior do abdômen.',
    difficulty: 'Fácil',
    instructions: ['Deite-se', 'Eleve os ombros do chão', 'Solte o ar na subida'],
    imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=5ER5Of4MOxc',
    equipment: 'None',
    reps: 20
  },

  // --- MOBILITY ---
  {
    id: 'warmup_arm_circles',
    name: 'Giros de Braço',
    description: 'Mobilidade de ombros.',
    difficulty: 'Fácil',
    instructions: ['Gire os braços para frente e trás'],
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=1VqT9e9e1P0',
    equipment: 'None',
    durationSeconds: 30
  },
  {
    id: 'stretch_cobra',
    name: 'Posição Cobra',
    description: 'Alongamento abdominal e lombar.',
    difficulty: 'Fácil',
    instructions: ['Deite de bruços', 'Empurre o chão estendendo os braços', 'Olhe para cima'],
    imageUrl: 'https://images.unsplash.com/photo-1544367563-12123d8965cd?w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=JDcdhTuycOI',
    equipment: 'None',
    durationSeconds: 30
  },
  {
    id: 'stretch_down_dog',
    name: 'Cachorro Olhando Baixo',
    description: 'Alongamento cadeia posterior.',
    difficulty: 'Fácil',
    instructions: ['Quadril para cima', 'Calcanhares em direção ao chão'],
    imageUrl: 'https://images.unsplash.com/photo-1544367563-12123d8965cd?w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=EC7FG54x08M',
    equipment: 'None',
    durationSeconds: 30
  },
  {
    id: 'mobility_cat_cow',
    name: 'Gato e Vaca',
    description: 'Mobilidade da coluna vertebral.',
    difficulty: 'Fácil',
    instructions: ['Em 4 apoios', 'Arqueie a coluna olhando para cima (Vaca)', 'Arredonde a coluna olhando para o umbigo (Gato)'],
    imageUrl: 'https://images.unsplash.com/photo-1544367563-12123d8965cd?w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=H75t3e1e9_8',
    equipment: 'None',
    durationSeconds: 45
  },
  {
    id: 'mobility_hip_opener',
    name: 'Alongamento Flexor Quadril',
    description: 'Liberta a tensão do quadril.',
    difficulty: 'Médio',
    instructions: ['Posição de afundo com joelho no chão', 'Empurre o quadril para frente', 'Mantenha o tronco reto'],
    imageUrl: 'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=800&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=uC0_5z3h3kE',
    equipment: 'None',
    durationSeconds: 30
  }
];
