import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { renderNarrativeWithBreaks } from './utils';

describe('utils', () => {
    describe('renderNarrativeWithBreaks', () => {
        it('deve dividir o texto num segmento com divider por causa do ---CHAPTER-BREAK---', () => {
            const input = "Capítulo 1---CHAPTER-BREAK---Capítulo 2";
            const rendered = renderNarrativeWithBreaks(input);
            const { container } = render(<div>{rendered}</div>);

            // Verifica que gerou ambos os capítulos
            expect(container.textContent).toContain('Capítulo 1');
            expect(container.textContent).toContain('Capítulo 2');

            // Verifica se o divider ❦ foi renderizado entre eles
            expect(container.textContent).toContain('❦');
        });

        it('deve retornar null para strings vazias', () => {
            const rendered = renderNarrativeWithBreaks("");
            expect(rendered).toBeNull();
        });
    });
});
