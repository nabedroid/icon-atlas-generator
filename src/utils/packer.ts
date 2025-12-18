export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PackedRect extends Rect {
  name: string;
  fullname: string;
  image: CanvasImageSource;
}

export class Packer {
  width: number;
  height: number;
  freeRects: Rect[];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.freeRects = [{ x: 0, y: 0, width: width, height: height }];
  }

  pack(rects: { width: number; height: number; name: string; fullname: string; image: CanvasImageSource }[]): PackedRect[] {
    // 高さ、次に幅の降順でソート（一般的なヒューリスティック）
    const sortedRects = [...rects].sort((a, b) => {
      if (b.height !== a.height) return b.height - a.height;
      return b.width - a.width;
    });

    const packed: PackedRect[] = [];
    const placedRects: Rect[] = []; // パッキング済みの矩形を追跡

    for (const rect of sortedRects) {
      const bestNode = this.findBestNode(rect.width, rect.height, placedRects);

      if (bestNode) {
        this.splitFreeNode(bestNode, rect);
        const newRect = {
          x: bestNode.x,
          y: bestNode.y,
          width: rect.width,
          height: rect.height,
        };
        placedRects.push(newRect);
        packed.push({
          ...newRect,
          name: rect.name,
          fullname: rect.fullname,
          image: rect.image
        });
      } else {
        console.warn(`Could not pack image ${rect.name}`);
      }
    }
    return packed;
  }

  private findBestNode(width: number, height: number, placedRects: Rect[]): Rect | null {
    let bestNode: Rect | null = null;
    let bestContactScore = -1;

    for (const rect of this.freeRects) {
      // 矩形が収まる場合のみ検討
      if (rect.width >= width && rect.height >= height) {
        // Contact Point Rule: 接触辺の長さをスコアとする
        const score = this.calculateContactScore(rect.x, rect.y, width, height, placedRects);

        if (score > bestContactScore) {
          bestNode = { x: rect.x, y: rect.y, width: width, height: height };
          bestContactScore = score;
        } else if (score === bestContactScore) {
          // スコアが同じ場合、左上（Y昇順、X昇順）を優先するなどのタイブレーカー
          // ここでは単純に配置位置の距離などで判断もできるが、既存の探索順序（リスト順）も影響する。
          // 原点に近い方を優先するロジックを追加
          if (bestNode && (rect.y < bestNode.y || (rect.y === bestNode.y && rect.x < bestNode.x))) {
            bestNode = { x: rect.x, y: rect.y, width: width, height: height };
          }
        }
      }
    }
    return bestNode;
  }

  private calculateContactScore(x: number, y: number, width: number, height: number, placedRects: Rect[]): number {
    let score = 0;

    // キャンバスの境界との接触
    if (x === 0 || x + width === this.width) score += height;
    if (y === 0 || y + height === this.height) score += width;

    // 既存の配置済み矩形との接触
    for (const p of placedRects) {
      // 垂直方向の接触 (左右の辺)
      if (p.x === x + width || p.x + p.width === x) {
        if (y >= p.y && y + height <= p.y + p.height) score += height;
        else if (y < p.y && y + height > p.y) score += Math.min(y + height, p.y + p.height) - Math.max(y, p.y);
      }

      // 水平方向の接触 (上下の辺)
      if (p.y === y + height || p.y + p.height === y) {
        if (x >= p.x && x + width <= p.x + p.width) score += width;
        else if (x < p.x && x + width > p.x) score += Math.min(x + width, p.x + p.width) - Math.max(x, p.x);
      }
    }
    return score;
  }

  private splitFreeNode(freeNode: Rect, usedNode: { width: number, height: number }) {
    const placedRect = { x: freeNode.x, y: freeNode.y, width: usedNode.width, height: usedNode.height };

    for (let i = 0; i < this.freeRects.length; i++) {
      if (this.intersect(this.freeRects[i], placedRect)) {
        const split = this.splitRect(this.freeRects[i], placedRect);
        this.freeRects.splice(i, 1, ...split);
        i += split.length - 1;
      }
    }
    this.pruneFreeList();
  }

  private intersect(r1: Rect, r2: Rect): boolean {
    return r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y;
  }

  private splitRect(freeRect: Rect, placedRect: Rect): Rect[] {
    const newRects: Rect[] = [];

    // Top
    if (placedRect.y > freeRect.y && placedRect.y < freeRect.y + freeRect.height) {
      newRects.push({
        x: freeRect.x,
        y: freeRect.y,
        width: freeRect.width,
        height: placedRect.y - freeRect.y
      });
    }
    // Bottom
    if (placedRect.y + placedRect.height < freeRect.y + freeRect.height) {
      newRects.push({
        x: freeRect.x,
        y: placedRect.y + placedRect.height,
        width: freeRect.width,
        height: freeRect.y + freeRect.height - (placedRect.y + placedRect.height)
      });
    }
    // Left
    if (placedRect.x > freeRect.x && placedRect.x < freeRect.x + freeRect.width) {
      newRects.push({
        x: freeRect.x,
        y: freeRect.y,
        width: placedRect.x - freeRect.x,
        height: freeRect.height
      });
    }
    // Right
    if (placedRect.x + placedRect.width < freeRect.x + freeRect.width) {
      newRects.push({
        x: placedRect.x + placedRect.width,
        y: freeRect.y,
        width: freeRect.x + freeRect.width - (placedRect.x + placedRect.width),
        height: freeRect.height
      });
    }
    return newRects;
  }

  private pruneFreeList() {
    for (let i = 0; i < this.freeRects.length; i++) {
      for (let j = i + 1; j < this.freeRects.length; j++) {
        if (this.isContained(this.freeRects[i], this.freeRects[j])) {
          this.freeRects.splice(i, 1);
          i--;
          break;
        }
        if (this.isContained(this.freeRects[j], this.freeRects[i])) {
          this.freeRects.splice(j, 1);
          j--;
        }
      }
    }
  }

  private isContained(a: Rect, b: Rect): boolean {
    return a.x >= b.x && a.y >= b.y &&
      a.x + a.width <= b.x + b.width &&
      a.y + a.height <= b.y + b.height;
  }
}
