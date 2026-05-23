export interface Scene {
  id: string;
  name: string;
  description: string;
  prompt: string;
}

export const scenes: Scene[] = [
  {
    id: 'town_square',
    name: '小镇广场',
    description: '热闹的市中心广场，喷泉闪烁，人们来来往往',
    prompt:
      '你正在热闹的小镇广场上。喷泉在阳光下闪闪发光，周围有各种商店和摊位。人们在这里相遇、交谈，交换着小镇上的最新消息。你感到充满活力，想与人分享生活中的趣事。',
  },
  {
    id: 'cafe',
    name: '咖啡馆',
    description: '温馨的街角咖啡馆，飘着咖啡和面包的香气',
    prompt:
      '你正在温馨的街角咖啡馆里。空气中弥漫着咖啡和新鲜面包的香气。柔和的灯光和舒适的沙发让人放松。这是一个亲密交谈的好地方，你可以与朋友倾诉心事，讨论生活的意义。',
  },
  {
    id: 'library',
    name: '图书馆',
    description: '安静的公共图书馆，书架高耸，充满智慧的气息',
    prompt:
      '你正在安静的公共图书馆里。高耸的书架上摆满了书籍，空气中弥漫着纸墨的香气。阳光透过彩色玻璃窗洒进来。在这里，人们轻声细语，讨论着知识、哲学和世界上的一切奥秘。',
  },
  {
    id: 'park',
    name: '公园',
    description: '绿树成荫的城市公园，鸟语花香，小径蜿蜒',
    prompt:
      '你正在绿树成荫的城市公园里。鸟儿在枝头歌唱，花朵在微风中摇曳。蜿蜒的小径通向幽静的角落，长椅散落在树荫下。在这里，人们可以放松心情，谈论自然、梦想和美好的回忆。',
  },
];

export const defaultSceneId = 'town_square';
