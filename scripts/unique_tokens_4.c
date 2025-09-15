#include <stdio.h>

int main() {
    FILE* fi = fopen("4_tokens.bin", "rb");
    FILE* fo = fopen("unique_tokens_4.bin", "wb");
    int max = 500000;
    int a[max];
    int n = 0;
    int it;
    int exist;
    int end = -1;
    while (1) {
        fread(&it, sizeof(int), 1, fi);
        if (it == end) break;
        exist = 0;
        for (int i = 0; i < n; i++)
            if (a[i] == it) {
                exist = 1;
                break;
            }
        if (exist) continue;
        a[n++] = it;
        fwrite(&it, sizeof(int), 1, fo);
    }
    fwrite(&end, sizeof(int), 1, fo);
    fclose(fi);
    fclose(fo);
    printf("Total unique: %d.\nSaved at unique_tokens_4.bin\n", n);
    return 0;
}
