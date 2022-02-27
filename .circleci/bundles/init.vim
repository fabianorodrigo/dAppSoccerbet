set number
set termguicolors
syntax on

call plug#begin("~/.vim/plugged")
" File explorer
Plug 'preservim/NERDTree'
Plug 'ryanoasis/vim-devicons'

" tema"
" Plug 'edersonferreira/dalton-vim'
Plug 'sonph/onehalf', { 'rtp': 'vim' }

" Intellisense and code completion with syntax highlighting
Plug 'sheerun/vim-polyglot'
"Plug 'neoclide/coc.nvim', {'branch': 'release'} " depois tem que instalar o pacote da linguagem preferida=> :CocInstall coc-json coc-tsserver
Plug 'tiagofumo/vim-nerdtree-syntax-highlight'
"Plug 'preservim/nerdcommenter'
Plug 'gko/vim-coloresque' 
Plug 'cohama/lexima.vim' 
"Plug 'rstacruz/vim-closer' " deixou um parêntese/colchete aberto?
"Plug 'thaerkh/vim-indentguides' "identaçao"

" Lint
Plug 'dense-analysis/ale'
" Barra de status"
Plug 'vim-airline/vim-airline'


call plug#end()

" configuração de teclas de atalho
nnoremap <C-s> :w!<CR> " salvar CTRL S"
nnoremap <C-q> :qa<CR> " sair CTRL Q"
nnoremap <silent> <s-Down> :m +1<CR> "Alternar a posição de uma linha com SHIFT + seta para cima "
nnoremap <silent> <s-Up> :m -2<CR> "Alternar a posição de uma linha com SHIFT + seta para baixo"
vnoremap <C-c> "+y<CR> " copiar um texto e enviar para área de transferência

" configuração NERDTree "
nnoremap <C-n> :NERDTreeToggle<CR>
let g:NERDTreeIgnore = ['node_modules']
let NERDTreeStatusline='NERDTree'
" Automaticaly close vim if NERDTree is only thing left open
autocmd bufenter * if (winnr("$") == 1 && exists("b:NERDTree") && b:NERDTree.isTabTree()) | q | endif

"configuração theme"
color onehalfdark

" configuração airline "
let g:airline#extensions#tabline#enabled = 1
let g:airline#extensions#tabline#show_buffers = 1
let g:airline#extensions#tabline#switch_buffers_and_tabs = 1
let g:airline#extensions#tabline#tab_nr_type = 1
let g:airline_theme='onehalfdark'

" Configurações do Vim IndentGuides

"let g:indentguides_spacechar = '▏'
"let g:indentguides_tabchar = '▏'

" Fim das configurações do Vim IndentGuides
