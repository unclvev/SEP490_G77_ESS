using System;
using System.Collections.Generic;

namespace SEP490_G77_ESS.Models;

public partial class SectionHierarchy
{
    public long SectionHierarchyId { get; set; }

    public long AncestorId { get; set; }

    public long DescendantId { get; set; }

    public long Depth { get; set; }

    public virtual Section Ancestor { get; set; } = null!;

    public virtual Section Descendant { get; set; } = null!;
}
