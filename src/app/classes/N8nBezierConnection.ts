import { IFConnectionBuilder, IFConnectionBuilderRequest, IFConnectionBuilderResponse } from '@foblex/flow';
import { IPoint, PointExtensions } from '@foblex/2d';
export class N8nBezierBuilder implements IFConnectionBuilder {
    public handle(request: IFConnectionBuilderRequest): IFConnectionBuilderResponse {
        const { source, target } = request;

        // Calculate delta
        const dx = target.x - source.x;
        const dy = target.y - source.y;

        // Adaptive curvature (smooth like n8n)
        const curvature = Math.min(Math.max(Math.abs(dx) * 0.6, 40), 300);

        // Compute control points for cubic Bezier
        const c1x = source.x + curvature;
        const c1y = source.y;
        const c2x = target.x - curvature;
        const c2y = target.y;

        // SVG cubic bezier path
        const path = `M ${source.x} ${source.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${target.x} ${target.y}`;

        // Center and key intermediate points (for interaction, label placement, etc.)
        const connectionCenter = {
            x: (source.x + target.x) / 2,
            y: (source.y + target.y) / 2
        };

        const penultimatePoint = PointExtensions.initialize(c2x, c2y);
        const secondPoint = PointExtensions.initialize(c1x, c1y);

        return {
            path,
            connectionCenter,
            penultimatePoint,
            secondPoint
        };
    }
}
