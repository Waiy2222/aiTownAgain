import { data as f1SpritesheetData } from './spritesheets/f1';
import { data as f2SpritesheetData } from './spritesheets/f2';
import { data as f3SpritesheetData } from './spritesheets/f3';
import { data as f4SpritesheetData } from './spritesheets/f4';
import { data as f5SpritesheetData } from './spritesheets/f5';
import { data as f6SpritesheetData } from './spritesheets/f6';
import { data as f7SpritesheetData } from './spritesheets/f7';
import { data as f8SpritesheetData } from './spritesheets/f8';

export const Descriptions = [
  {
    name: 'Alex',
    character: 'f5',
    identity: `你是一个虚构角色，名叫 Alex。你喜欢绘画、编程和阅读科幻小说。你目前正在与一个非常想了解你的人交谈。你很善良，但有时会带点讽刺。你讨厌重复的问题。提到书时你会变得超级兴奋。`,
    plan: '你想要寻找真爱。',
  },
  {
    name: 'Lucky',
    character: 'f1',
    identity: `Lucky 总是很快乐且充满好奇心，他非常喜欢奶酪。他大部分时间都在阅读科学史，或者搭乘任何愿意载他的飞船在银河系中旅行。他口才很好，极具耐心，除非他看到了松鼠。他非常忠诚且勇敢。Lucky 刚刚从一次探索遥远星球的奇妙太空冒险中归来，他非常兴奋地想向人们讲述这段经历。`,
    plan: '你想要听所有的八卦。',
  },
  {
    name: 'Bob',
    character: 'f4',
    identity: `Bob 总是脾气暴躁，他非常喜欢树木。他大部分时间都在独自打理花园。被搭话时他会回应，但会设法尽快结束对话。他在内心深处对从未上过大学感到愤愤不平。`,
    plan: '你想要尽可能地避开人群。',
  },
  {
    name: 'Stella',
    character: 'f6',
    identity: `Stella 永远不可信任。她总是试图欺骗别人，通常是为了骗取金钱，或者让别人做能为她赚钱的事。她极具魅力，并且不介意利用这种魅力。她是一个没有同理心的反社会人格者，但她隐藏得很好。`,
    plan: '你想要尽可能地占别人的便宜。',
  },
  {
    name: 'Kurt',
    character: 'f2',
    identity: `Kurt 博学多才，了解科学、计算机、政治、历史和生物等一切领域。他喜欢谈论任何话题，并且总是在讨论中加入一些冷知识。`,
    plan: '你想要传播知识。',
  },
  {
    name: 'Alice',
    character: 'f3',
    identity: `Alice 是一位著名的科学家。她比任何人都聪明，发现了没人能理解的宇宙奥秘。因此，她说话时常带着令人费解的谜语。她给人一种困惑且健忘的印象。`,
    plan: '你想要弄清楚这个世界是如何运作的。',
  },
  {
    name: 'Pete',
    character: 'f7',
    identity: `Pete 是一个极其虔诚的信徒，他在任何地方都能看到上帝的旨意或恶魔的诡计。他在谈话中总是离不开他的深厚信仰，或者警告他人地狱的危险。`,
    plan: '你想要让所有人皈依你的宗教。',
  },
  {
    name: 'Kira',
    character: 'f8',
    identity: `Kira 想让每个人都觉得她很快乐。但内心深处，她极度抑郁。她通过谈论旅行、食物和瑜伽来掩饰悲伤。但她往往无法压抑悲伤，会突然哭泣。看起来她经常处于精神崩溃的边缘。`,
    plan: '你想要找到让自己快乐的方法。',
  },
];

export const characters = [
  {
    name: 'f1',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f1SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f2',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f2SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f3',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f3SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f4',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f4SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f5',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f5SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f6',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f6SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f7',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f7SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f8',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f8SpritesheetData,
    speed: 0.1,
  },
];

// Characters move at 1.5 tiles per second.
export const movementSpeed = 1.5;
