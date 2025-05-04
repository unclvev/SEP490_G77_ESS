// utils.js
export function buildSectionTree(sectionsRaw) {
    // 1. Tạo map secId -> node
    const nodeMap = {};
    sectionsRaw.forEach(s => {
      nodeMap[s.secId] = {
        key: `section-${s.secId}`,
        title: s.secName,
        children: []
      };
    });
  
    // 2. Gom tất cả hierarchy entries depth=1
    const links = [];
    sectionsRaw.forEach(s => {
      const all = [
        ...(s.ancestors || []),
        ...(s.descendants || [])
      ];
      all.forEach(h => {
        if (h.depth === 1 && h.ancestorId !== h.descendantId) {
          links.push({ parentId: h.ancestorId, childId: h.descendantId });
        }
      });
    });
  
    // 3. Gán con vào parent
    links.forEach(({ parentId, childId }) => {
      const p = nodeMap[parentId];
      const c = nodeMap[childId];
      if (p && c) {
        p.children.push(c);
      }
    });
  
    // 4. Lấy roots: những secId không bao giờ làm child
    const childIds = new Set(links.map(l => l.childId));
    const roots = sectionsRaw
      .filter(s => !childIds.has(s.secId))
      .map(s => nodeMap[s.secId]);
  
    return roots;
  }
  